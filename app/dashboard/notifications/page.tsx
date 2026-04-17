"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  Wrench,
  Check,
  EyeOff,
} from "lucide-react";
import type { Notification, NotificationType } from "@/lib/types";
import { useSelectedJob } from "@/lib/job-context";
import Link from "next/link";
import { useProfile } from "../layout";
import { JobBadge } from "@/components/job-badge";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "new_task":
      return ClipboardList;
    case "task_comment":
      return MessageSquare;
    case "task_high_priority":
      return AlertTriangle;
    case "task_completed":
      return CheckCircle2;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case "new_task":
      return "text-blue-400 bg-blue-400/10";
    case "task_comment":
      return "text-purple-400 bg-purple-400/10";
    case "task_high_priority":
      return "text-amber-400 bg-amber-400/10";
    case "task_completed":
      return "text-emerald-400 bg-emerald-400/10";
  }
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NotificationsPage() {
  useProfile();
  const { selectedJob } = useSelectedJob();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchData = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}`
        : "";
      const res = await fetch(`/api/notifications${params}`);
      if (res.ok) setNotifications(await res.json());
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchData();
    }
  }

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
    } catch {
      // silent
    }
  }

  async function markUnread(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
    );

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id], unread: true }),
      });
    } catch {
      // silent
    }
  }

  const jobScoped = selectedJob
    ? notifications.filter((n) => n.jobId === selectedJob.id)
    : notifications;

  const filtered = jobScoped.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = jobScoped.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted text-sm mt-1">
            Stay up to date with task activity and updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <Check className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 p-1 rounded-xl glass w-fit">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-all ${
                filter === f
                  ? "bg-accent/20 text-accent-light font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent/30 text-accent-light text-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-5 w-48 bg-white/5 rounded mb-2" />
              <div className="h-4 w-64 bg-white/3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bell className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">
            {filter === "unread" ? "All caught up!" : "No notifications"}
          </h3>
          <p className="text-sm text-muted">
            {filter === "unread"
              ? "You've read all your notifications."
              : "Notifications about tasks and comments will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClasses = getNotificationColor(notification.type);
            const [iconColor, iconBg] = colorClasses.split(" ");

            return (
              <div
                key={notification.id}
                className={`glass-card rounded-xl p-5 flex items-start gap-4 transition-all ${
                  !notification.read
                    ? "border-l-2 border-l-accent-light"
                    : "opacity-60"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${iconBg} ${iconColor}`}
                    >
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted">
                      {timeAgo(notification.timestamp)}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-accent-light shrink-0" />
                    )}
                  </div>

                  <p className="text-sm mt-1 line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {notification.taskId && (
                      <Link
                        href="/dashboard/tasks"
                        className="text-xs text-accent-light hover:underline"
                      >
                        View task →
                      </Link>
                    )}
                    {notification.equipmentName && notification.equipmentId && (
                      <Link
                        href={`/dashboard/equipment/${notification.equipmentId}`}
                        className="flex items-center gap-1 text-xs text-muted hover:text-accent-light transition-colors"
                      >
                        <Wrench className="w-3 h-3" />
                        {notification.equipmentName}
                      </Link>
                    )}
                    <JobBadge jobId={notification.jobId} />
                  </div>
                </div>

                {!notification.read ? (
                  <button
                    onClick={() => markRead(notification.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4 text-muted" />
                  </button>
                ) : (
                  <button
                    onClick={() => markUnread(notification.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                    title="Mark as unread"
                  >
                    <EyeOff className="w-4 h-4 text-muted" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
