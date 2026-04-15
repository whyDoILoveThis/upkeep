import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import type { Reminder, Task, BillingRecord, HandymanTime } from "@/lib/types";

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
  const scopeId = isManagement && homeownerId ? homeownerId : userId;
  const isScoped = isManagement && homeownerId;

  // Fetch counts in parallel
  const [equipSnap, remindersSnap, tasksSnap, billingSnap, timeSnap] = await Promise.all([
    isScoped
      ? db.ref("equipment").orderByChild("userId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("equipment").get()
        : db.ref("equipment").orderByChild("userId").equalTo(userId).get(),
    isScoped
      ? db.ref("reminders").orderByChild("userId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("reminders").get()
        : db.ref("reminders").orderByChild("userId").equalTo(userId).get(),
    isScoped
      ? db.ref("tasks").orderByChild("homeownerId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("tasks").get()
        : db.ref("tasks").orderByChild("homeownerId").equalTo(userId).get(),
    isScoped
      ? db.ref("billing").orderByChild("homeownerId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("billing").get()
        : db.ref("billing").orderByChild("homeownerId").equalTo(userId).get(),
    isScoped
      ? db.ref("handymanTime").orderByChild("userId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("handymanTime").orderByChild("managementId").equalTo(userId).get()
        : db.ref("handymanTime").orderByChild("userId").equalTo(userId).get(),
  ]);

  const equipmentCount = equipSnap.exists() ? Object.keys(equipSnap.val()).length : 0;

  const reminders: Reminder[] = remindersSnap.exists()
    ? Object.entries(remindersSnap.val() as Record<string, Omit<Reminder, "id">>).map(([id, d]) => ({ id, ...d }))
    : [];
  const pendingReminders = reminders.filter((r) => !r.completed).length;

  const tasks: Task[] = tasksSnap.exists()
    ? Object.entries(tasksSnap.val() as Record<string, Omit<Task, "id">>).map(([id, d]) => ({ id, ...d }))
    : [];
  const activeTasks = tasks.filter((t) => t.status !== "completed").length;

  const bills: BillingRecord[] = billingSnap.exists()
    ? Object.entries(billingSnap.val() as Record<string, Omit<BillingRecord, "id">>).map(([id, d]) => ({ id, ...d }))
    : [];
  const pendingBills = bills.filter((b) => b.status === "pending" || b.status === "overdue").length;

  // Handyman time — aggregate entries for the quarter
  const { quarterStart, quarterEnd } = getQuarterRange();
  let handymanTimeData: { scheduledMinutes: number; completedMinutes: number; quarterStart: string; quarterEnd: string };

  if (timeSnap.exists()) {
    const htEntries = Object.values(timeSnap.val() as Record<string, HandymanTime>);
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

  // Upcoming reminders (next 5 uncompleted)
  const upcomingReminders = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime())
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.title,
      dueDate: r.dueDate,
      equipmentName: r.equipmentName,
    }));

  return NextResponse.json({
    equipmentCount,
    pendingReminders,
    activeTasks,
    pendingBills,
    handymanTime: handymanTimeData,
    recentTasks,
    upcomingReminders,
  });
}
