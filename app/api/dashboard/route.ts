import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import type { Task, BillingRecord, HandymanTime, Job } from "@/lib/types";

function getQuarterRange() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), quarter * 3, 1);
  const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  return { quarterStart: start.toISOString(), quarterEnd: end.toISOString() };
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.exists() ? userSnap.val() : null;
  const isManagement = user?.role === "management";

  const homeownerId = req.nextUrl.searchParams.get("homeownerId");
  const jobId = req.nextUrl.searchParams.get("jobId");
  const scopeId = isManagement && homeownerId ? homeownerId : userId;
  const isScoped = isManagement && homeownerId;

  // Fetch counts in parallel
  const [equipSnap, tasksSnap, billingSnap, timeSnap, jobsSnap, readSnap] = await Promise.all([
    isScoped
      ? db.ref("equipment").orderByChild("userId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("equipment").orderByChild("managementId").equalTo(userId).get()
        : db.ref("equipment").orderByChild("userId").equalTo(userId).get(),
    isScoped
      ? db.ref("tasks").orderByChild("homeownerId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("tasks").orderByChild("managementId").equalTo(userId).get()
        : db.ref("tasks").orderByChild("homeownerId").equalTo(userId).get(),
    isScoped
      ? db.ref("billing").orderByChild("homeownerId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("billing").orderByChild("managementId").equalTo(userId).get()
        : db.ref("billing").orderByChild("homeownerId").equalTo(userId).get(),
    isScoped
      ? db.ref("handymanTime").orderByChild("userId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("handymanTime").orderByChild("managementId").equalTo(userId).get()
        : db.ref("handymanTime").orderByChild("userId").equalTo(userId).get(),
    isManagement
      ? db.ref("jobs").orderByChild("managementId").equalTo(userId).get()
      : db.ref("jobs").orderByChild("homeownerId").equalTo(userId).get(),
    db.ref(`notificationReads/${userId}`).get(),
  ]);

  const equipmentRaw = equipSnap.exists() ? Object.keys(equipSnap.val()) : [];
  // If jobId filtering, we need to load full equipment to check jobId
  let equipmentCount: number;
  if (jobId && equipSnap.exists()) {
    const eqEntries = Object.values(equipSnap.val() as Record<string, { jobId?: string }>);
    equipmentCount = eqEntries.filter((e) => e.jobId === jobId).length;
  } else {
    equipmentCount = equipmentRaw.length;
  }

  const jobs: Job[] = jobsSnap.exists()
    ? Object.entries(jobsSnap.val() as Record<string, Omit<Job, "id">>).map(([id, d]) => ({ id, ...d }))
    : [];
  const activeJobs = jobs.filter((j) => j.status === "active").length;

  const readIds: Record<string, boolean> = readSnap.exists() ? readSnap.val() : {};

  let tasks: Task[] = tasksSnap.exists()
    ? Object.entries(tasksSnap.val() as Record<string, Omit<Task, "id">>).map(([id, d]) => ({ id, ...d }))
    : [];
  if (jobId) tasks = tasks.filter((t) => t.jobId === jobId);
  const activeTasks = tasks.filter((t) => t.status !== "completed").length;

  // Generate notifications from tasks
  const now = Date.now();
  const DAY = 86_400_000;
  interface DashNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    taskId?: string;
    timestamp: number;
    read: boolean;
  }
  const allNotifications: DashNotification[] = [];

  for (const task of tasks) {
    if (task.status === "pending" && now - task.createdAt < 7 * DAY) {
      const nId = `new-task-${task.id}`;
      allNotifications.push({ id: nId, type: "new_task", title: "New Task", message: task.title, taskId: task.id, timestamp: task.createdAt, read: !!readIds[nId] });
    }
    if (task.priority === "high" && task.status !== "completed") {
      const nId = `high-priority-${task.id}`;
      allNotifications.push({ id: nId, type: "task_high_priority", title: "High Priority", message: task.title, taskId: task.id, timestamp: task.updatedAt || task.createdAt, read: !!readIds[nId] });
    }
    if (task.status === "completed" && task.updatedAt && now - task.updatedAt < 7 * DAY) {
      const nId = `completed-${task.id}`;
      allNotifications.push({ id: nId, type: "task_completed", title: "Task Completed", message: task.title, taskId: task.id, timestamp: task.updatedAt, read: !!readIds[nId] });
    }
    if (task.updates) {
      for (const update of Object.values(task.updates)) {
        if (now - update.timestamp < 14 * DAY && update.authorId !== userId) {
          const nId = `comment-${task.id}-${update.id}`;
          allNotifications.push({ id: nId, type: "task_comment", title: "New Comment", message: `${update.authorName}: ${update.message}`, taskId: task.id, timestamp: update.timestamp, read: !!readIds[nId] });
        }
      }
    }
  }

  allNotifications.sort((a, b) => b.timestamp - a.timestamp);
  const pendingReminders = allNotifications.filter((n) => !n.read).length;

  let bills: BillingRecord[] = billingSnap.exists()
    ? Object.entries(billingSnap.val() as Record<string, Omit<BillingRecord, "id">>).map(([id, d]) => ({ id, ...d }))
    : [];
  if (jobId) bills = bills.filter((b) => b.jobId === jobId);
  const pendingBills = bills.filter((b) => b.status === "pending" || b.status === "overdue").length;

  // Handyman time — aggregate entries for the quarter
  const { quarterStart, quarterEnd } = getQuarterRange();
  let handymanTimeData: { scheduledMinutes: number; completedMinutes: number; quarterStart: string; quarterEnd: string };

  if (timeSnap.exists()) {
    let htEntries = Object.values(timeSnap.val() as Record<string, HandymanTime>);
    if (jobId) htEntries = htEntries.filter((e) => e.jobId === jobId);
    const qStart = new Date(quarterStart);
    const qEnd = new Date(quarterEnd);
    const quarterFiltered = htEntries.filter((e) => {
      const s = new Date(e.startTime);
      return s >= qStart && s <= qEnd;
    });

    const scheduledMinutes = quarterFiltered.reduce((sum, e) => {
      return sum + Math.max(0, Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000));
    }, 0);

    const completedMinutes = quarterFiltered.reduce((sum, e) => {
      if (new Date(e.endTime) <= new Date()) {
        return sum + Math.max(0, Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000));
      }
      return sum;
    }, 0);

    handymanTimeData = { scheduledMinutes, completedMinutes, quarterStart, quarterEnd };
  } else {
    handymanTimeData = { scheduledMinutes: 0, completedMinutes: 0, quarterStart, quarterEnd };
  }

  // Recent tasks (last 5)
  const recentTasks = tasks
    .sort((a, b) => (b.updatedAt as number) - (a.updatedAt as number))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      updatedAt: t.updatedAt,
    }));

  // Recent notifications (top 5)
  const upcomingReminders = allNotifications.slice(0, 5);

  return NextResponse.json({
    equipmentCount,
    activeJobs,
    pendingReminders,
    activeTasks,
    pendingBills,
    handymanTime: handymanTimeData,
    recentTasks,
    upcomingReminders,
  });
}
