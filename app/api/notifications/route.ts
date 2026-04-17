import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import type { Task, Notification, NotificationType } from "@/lib/types";

const DAY = 86_400_000;

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.exists() ? userSnap.val() : null;
  const isManagement = user?.role === "management";

  const homeownerId = req.nextUrl.searchParams.get("homeownerId");
  const jobId = req.nextUrl.searchParams.get("jobId");
  const scopeId = isManagement && homeownerId ? homeownerId : userId;
  const isScoped = isManagement && homeownerId;

  // Fetch tasks and read-receipts in parallel
  const [tasksSnap, readSnap] = await Promise.all([
    isScoped
      ? db.ref("tasks").orderByChild("homeownerId").equalTo(scopeId).get()
      : isManagement
        ? db.ref("tasks").orderByChild("managementId").equalTo(userId).get()
        : db.ref("tasks").orderByChild("homeownerId").equalTo(userId).get(),
    db.ref(`notificationReads/${userId}`).get(),
  ]);

  let tasks: Task[] = tasksSnap.exists()
    ? Object.entries(
        tasksSnap.val() as Record<string, Omit<Task, "id">>,
      ).map(([id, d]) => ({ id, ...d }))
    : [];

  if (jobId) tasks = tasks.filter((t) => t.jobId === jobId);

  const readIds: Record<string, boolean> = readSnap.exists()
    ? readSnap.val()
    : {};

  const now = Date.now();
  const notifications: Notification[] = [];

  for (const task of tasks) {
    // New tasks (created in last 7 days, still pending)
    if (task.status === "pending" && now - task.createdAt < 7 * DAY) {
      const nId = `new-task-${task.id}`;
      notifications.push({
        id: nId,
        type: "new_task",
        title: "New Task",
        message: task.title,
        taskId: task.id,
        taskTitle: task.title,
        equipmentId: task.equipmentId,
        equipmentName: task.equipmentName,
        jobId: task.jobId,
        timestamp: task.createdAt,
        read: !!readIds[nId],
      });
    }

    // High priority tasks still active
    if (task.priority === "high" && task.status !== "completed") {
      const nId = `high-priority-${task.id}`;
      notifications.push({
        id: nId,
        type: "task_high_priority",
        title: "High Priority",
        message: task.title,
        taskId: task.id,
        taskTitle: task.title,
        equipmentId: task.equipmentId,
        equipmentName: task.equipmentName,
        jobId: task.jobId,
        timestamp: task.updatedAt || task.createdAt,
        read: !!readIds[nId],
      });
    }

    // Recently completed tasks (last 7 days)
    if (task.status === "completed" && task.updatedAt && now - task.updatedAt < 7 * DAY) {
      const nId = `completed-${task.id}`;
      notifications.push({
        id: nId,
        type: "task_completed",
        title: "Task Completed",
        message: task.title,
        taskId: task.id,
        taskTitle: task.title,
        equipmentId: task.equipmentId,
        equipmentName: task.equipmentName,
        jobId: task.jobId,
        timestamp: task.updatedAt,
        read: !!readIds[nId],
      });
    }

    // Recent comments (last 14 days)
    if (task.updates) {
      const updates = Object.values(task.updates);
      for (const update of updates) {
        if (now - update.timestamp < 14 * DAY && update.authorId !== userId) {
          const nId = `comment-${task.id}-${update.id}`;
          notifications.push({
            id: nId,
            type: "task_comment",
            title: "New Comment",
            message: `${update.authorName} on "${task.title}": ${update.message}`,
            taskId: task.id,
            taskTitle: task.title,
            equipmentId: task.equipmentId,
            equipmentName: task.equipmentName,
            jobId: task.jobId,
            timestamp: update.timestamp,
            read: !!readIds[nId],
          });
        }
      }
    }
  }

  // Sort newest first
  notifications.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json(notifications);
}

/** Mark notifications as read or unread */
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notificationIds, unread } = await req.json();
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();

  if (unread) {
    // Mark as unread by removing from reads
    const updates: Record<string, null> = {};
    for (const id of notificationIds) {
      if (typeof id === "string") {
        updates[id] = null;
      }
    }
    await db.ref(`notificationReads/${userId}`).update(updates);
  } else {
    // Mark as read
    const updates: Record<string, boolean> = {};
    for (const id of notificationIds) {
      if (typeof id === "string") {
        updates[id] = true;
      }
    }
    await db.ref(`notificationReads/${userId}`).update(updates);
  }

  return NextResponse.json({ ok: true });
}
