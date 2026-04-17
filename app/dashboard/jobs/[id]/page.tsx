"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "../../layout";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Wrench,
  Bell,
  ClipboardList,
  Receipt,
  FolderOpen,
  Timer,
  Pencil,
  X,
  FileText,
  User,
} from "lucide-react";
import type {
  Job,
  Equipment,
  Notification,
  Task,
  BillingRecord,
  FileRecord,
} from "@/lib/types";
import { HandymanTimeRing } from "@/components/handyman-time-ring";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useProfile();

  const [job, setJob] = useState<Job | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [handymanTimeStats, setHandymanTimeStats] = useState<{
    scheduledMinutes: number;
    completedMinutes: number;
    quarterStart: string;
    quarterEnd: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    address: "",
    notes: "",
    status: "active" as Job["status"],
  });

  const jobId = params.id as string;

  const fetchData = useCallback(async () => {
    try {
      const jobRes = await fetch(`/api/jobs/${jobId}`);
      if (!jobRes.ok) {
        router.replace("/dashboard/jobs");
        return;
      }
      const jobData = await jobRes.json();
      setJob(jobData);

      const hid = jobData.homeownerId;
      const [eqRes, notifRes, taskRes, billRes, fileRes, dashRes] =
        await Promise.all([
          fetch("/api/equipment"),
          fetch(`/api/notifications?homeownerId=${hid}&jobId=${jobId}`),
          fetch("/api/tasks"),
          fetch("/api/billing"),
          fetch("/api/files"),
          fetch(`/api/dashboard?homeownerId=${hid}&jobId=${jobId}`),
        ]);
      if (eqRes.ok) {
        const allEq = await eqRes.json();
        setEquipment(
          allEq.filter((e: Equipment) => e.userId === hid && e.jobId === jobId),
        );
      }
      if (notifRes.ok) {
        const allNotifs = await notifRes.json();
        setNotifications(allNotifs);
      }
      if (taskRes.ok) {
        const allTasks = await taskRes.json();
        setTasks(
          allTasks.filter(
            (t: Task) => t.homeownerId === hid && t.jobId === jobId,
          ),
        );
      }
      if (billRes.ok) {
        const allBills = await billRes.json();
        setBills(
          allBills.filter(
            (b: BillingRecord) => b.homeownerId === hid && b.jobId === jobId,
          ),
        );
      }
      if (fileRes.ok) {
        const allFiles = await fileRes.json();
        setFiles(
          allFiles.filter(
            (f: FileRecord) => f.userId === hid && f.jobId === jobId,
          ),
        );
      }
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.handymanTime) {
          setHandymanTimeStats(dashData.handymanTime);
        }
      }
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  function openEdit() {
    if (!job) return;
    setEditForm({
      title: job.title,
      address: job.address || "",
      notes: job.notes || "",
      status: job.status,
    });
    setShowEditModal(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchData();
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  }

  const activeTasks = tasks.filter((t) => t.status !== "completed").length;
  const pendingBills = bills.filter(
    (b) => b.status === "pending" || b.status === "overdue",
  ).length;
  const totalBilled = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Jobs
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  job.status === "active"
                    ? "bg-success/10 text-success"
                    : job.status === "paused"
                      ? "bg-warning/10 text-warning"
                      : "bg-white/5 text-muted"
                }`}
              >
                {job.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              {job.homeownerName && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {job.homeownerName}
                </span>
              )}
              {job.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.address}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={openEdit}
            className="btn-secondary flex items-center gap-2 text-sm shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Job
          </button>
        </div>

        {job.notes && (
          <p className="text-sm text-muted mt-3 glass rounded-xl px-4 py-3">
            {job.notes}
          </p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center mb-2">
            <Wrench className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{equipment.length}</div>
          <div className="text-xs text-muted">Equipment</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center mb-2">
            <ClipboardList className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold">{activeTasks}</div>
          <div className="text-xs text-muted">Active Tasks</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="w-9 h-9 rounded-lg bg-rose-400/10 flex items-center justify-center mb-2">
            <Receipt className="w-4.5 h-4.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold">{pendingBills}</div>
          <div className="text-xs text-muted">Pending Bills</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center mb-2">
            <Bell className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold">
            {notifications.filter((n) => !n.read).length}
          </div>
          <div className="text-xs text-muted">Notifications</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Handyman Time */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Timer className="w-4 h-4 text-accent-light" />
            Handyman Time
          </h2>
          {handymanTimeStats ? (
            <HandymanTimeRing
              scheduledMinutes={handymanTimeStats.scheduledMinutes}
              completedMinutes={handymanTimeStats.completedMinutes}
              quarterStart={handymanTimeStats.quarterStart}
              quarterEnd={handymanTimeStats.quarterEnd}
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted">
              No time scheduled
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-accent-light" />
            Tasks ({tasks.length})
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {tasks.length > 0 ? (
              tasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{task.title}</div>
                    <div className="text-xs text-muted capitalize">
                      {task.priority}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === "completed"
                        ? "bg-success/10 text-success"
                        : task.status === "in-progress"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-white/5 text-muted"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted text-center py-8">
                No tasks yet
              </div>
            )}
          </div>
        </div>

        {/* Billing Summary */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-accent-light" />
            Billing
          </h2>
          <div className="space-y-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Total Billed</span>
              <span className="font-semibold">
                ${totalBilled.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Total Paid</span>
              <span className="font-semibold text-success">
                ${totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Outstanding</span>
              <span className="font-semibold text-rose-400">
                ${(totalBilled - totalPaid).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {bills.slice(0, 5).map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span className="text-muted truncate">{bill.description}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    bill.status === "paid"
                      ? "bg-success/10 text-success"
                      : bill.status === "overdue"
                        ? "bg-danger/10 text-danger"
                        : "bg-white/5 text-muted"
                  }`}
                >
                  ${bill.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment + Files Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-accent-light" />
            Equipment ({equipment.length})
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {equipment.length > 0 ? (
              equipment.map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {eq.name}
                    </div>
                    <div className="text-xs text-muted">
                      {eq.category}
                      {eq.location ? ` · ${eq.location}` : ""}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted text-center py-8">
                No equipment
              </div>
            )}
          </div>
        </div>

        {/* Files */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <FolderOpen className="w-4 h-4 text-accent-light" />
            Files ({files.length})
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {files.length > 0 ? (
              files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-muted">
                      {file.equipmentName || file.type} ·{" "}
                      {(file.size / 1024).toFixed(0)}KB
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted text-center py-8">
                No files
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Job Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative w-full max-w-lg glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Edit Job</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value as Job["status"],
                    }))
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
