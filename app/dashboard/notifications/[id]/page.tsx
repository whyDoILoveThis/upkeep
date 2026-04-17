"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
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
import { useProfile } from "../../layout";
import { JobBadge } from "@/components/job-badge";
import { PhotoLightbox } from "@/components/photo-lightbox";

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

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationDetailPage() {
  useProfile();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { selectedJob } = useSelectedJob();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}&jobId=${selectedJob.id}`
        : "";
      const res = await fetch(`/api/notifications${params}`);
      if (!res.ok) return;
      const all: Notification[] = await res.json();
      const decoded = decodeURIComponent(id);
      const found = all.find((n) => n.id === decoded);
      setNotification(found ?? null);

      // Auto-mark as read
      if (found && !found.read) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [found.id] }),
        });
        setNotification((prev) => (prev ? { ...prev, read: true } : prev));
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [id, selectedJob]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleRead() {
    if (!notification) return;
    const newRead = !notification.read;
    setNotification((prev) => (prev ? { ...prev, read: newRead } : prev));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationIds: [notification.id],
          ...(newRead ? {} : { unread: true }),
        }),
      });
    } catch {
      // revert
      setNotification((prev) => (prev ? { ...prev, read: !newRead } : prev));
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-xl p-6 animate-pulse">
          <div className="h-6 w-48 bg-white/5 rounded mb-4" />
          <div className="h-4 w-72 bg-white/3 rounded mb-2" />
          <div className="h-4 w-56 bg-white/3 rounded" />
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bell className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">Notification not found</h3>
          <p className="text-sm text-muted">
            This notification may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  const Icon = getNotificationIcon(notification.type);
  const colorClasses = getNotificationColor(notification.type);
  const [iconColor, iconBg] = colorClasses.split(" ");

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to notifications
      </button>

      <div className="glass-card rounded-xl p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${iconBg} ${iconColor}`}
              >
                {notification.title}
              </span>
              {notification.read ? (
                <span className="text-xs text-muted">Read</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-accent-light">
                  <span className="w-2 h-2 rounded-full bg-accent-light" />
                  Unread
                </span>
              )}
            </div>

            <p className="text-sm text-muted">{formatDate(notification.timestamp)}</p>
          </div>

          <button
            onClick={toggleRead}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title={notification.read ? "Mark as unread" : "Mark as read"}
          >
            {notification.read ? (
              <EyeOff className="w-4 h-4 text-muted" />
            ) : (
              <Check className="w-4 h-4 text-muted" />
            )}
          </button>
        </div>

        {/* Message */}
        <div className="mt-5">
          <p className="text-base leading-relaxed">{notification.message}</p>
        </div>

        {/* Photos */}
        {notification.photoUrls && notification.photoUrls.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-muted mb-2 uppercase tracking-wider font-medium">
              Attached Photos
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {notification.photoUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLightboxPhotos(notification.photoUrls!);
                    setLightboxIndex(idx);
                  }}
                  className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-accent/50 transition-all cursor-zoom-in"
                >
                  <Image
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center gap-3">
          {notification.taskId && (
            <Link
              href="/dashboard/tasks"
              className="text-sm text-accent-light hover:underline flex items-center gap-1.5"
            >
              <ClipboardList className="w-4 h-4" />
              View task
            </Link>
          )}
          {notification.equipmentName && notification.equipmentId && (
            <Link
              href={`/dashboard/equipment/${notification.equipmentId}`}
              className="text-sm text-muted hover:text-accent-light transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" />
              {notification.equipmentName}
            </Link>
          )}
          <JobBadge jobId={notification.jobId} />
        </div>
      </div>

      {lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxPhotos([])}
        />
      )}
    </div>
  );
}
