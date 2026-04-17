"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useProfile } from "../layout";
import {
  Plus,
  ClipboardList,
  MessageSquare,
  Send,
  X,
  Flag,
  User,
  ChevronDown,
  ChevronUp,
  Pencil,
  Wrench,
  ImagePlus,
} from "lucide-react";
import Image from "next/image";
import type { Task, Equipment, UserProfile } from "@/lib/types";
import { useSelectedJob } from "@/lib/job-context";
import HomeownerSearch from "@/components/homeowner-search";
import { JobBadge } from "@/components/job-badge";
import { PillSelect } from "@/components/pill-select";
import { PhotoLightbox } from "@/components/photo-lightbox";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "bg-white/5 text-muted",
  "in-progress": "bg-amber-400/10 text-amber-400",
  completed: "bg-success/10 text-success",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-400/10 text-blue-400",
  medium: "bg-amber-400/10 text-amber-400",
  high: "bg-red-400/10 text-red-400",
};

const statusOptions = [
  { value: "pending", label: "Pending", colorClass: statusColors.pending },
  {
    value: "in-progress",
    label: "In Progress",
    colorClass: statusColors["in-progress"],
  },
  {
    value: "completed",
    label: "Completed",
    colorClass: statusColors.completed,
  },
];

const priorityOptions = [
  { value: "low", label: "Low", colorClass: priorityColors.low },
  { value: "medium", label: "Medium", colorClass: priorityColors.medium },
  { value: "high", label: "High", colorClass: priorityColors.high },
];

export default function TasksPage() {
  const { profile } = useProfile();
  const { selectedJob, jobs } = useSelectedJob();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedHomeowner, setSelectedHomeowner] =
    useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newUpdate, setNewUpdate] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<
    { file: File; preview: string }[]
  >([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending" as Task["status"],
    priority: "medium" as Task["priority"],
    equipmentId: "",
    homeownerId: "",
    jobId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}`
        : "";
      const endpoints = [`/api/tasks${params}`, `/api/equipment${params}`];

      const responses = await Promise.all(endpoints.map((url) => fetch(url)));
      if (responses[0].ok) setTasks(await responses[0].json());
      if (responses[1].ok) setEquipment(await responses[1].json());
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  function resetForm() {
    setForm({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      equipmentId: "",
      homeownerId: "",
      jobId: "",
    });
    setEditingTaskId(null);
    setSelectedHomeowner(null);
  }

  function openEdit(task: Task) {
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      equipmentId: task.equipmentId || "",
      homeownerId: task.homeownerId || "",
      jobId: task.jobId || "",
    });
    setEditingTaskId(task.id);
    setSelectedHomeowner(
      task.homeownerId && task.homeownerName
        ? ({ id: task.homeownerId, name: task.homeownerName } as UserProfile)
        : null,
    );
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingTaskId ? `/api/tasks/${editingTaskId}` : "/api/tasks";
      const method = editingTaskId ? "PATCH" : "POST";

      // Resolve equipment name for the payload
      const equipmentName = form.equipmentId
        ? equipment.find((eq) => eq.id === form.equipmentId)?.name
        : undefined;

      const body = editingTaskId
        ? { ...form, equipmentName: equipmentName || null }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(taskId: string, status: Task["status"]) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch {
      // handle
    }
  }

  async function sendProjectUpdate(taskId: string) {
    if (!newUpdate.trim() && pendingPhotos.length === 0) return;
    if (!newUpdate.trim()) return;
    setSendingUpdate(true);
    try {
      // Upload pending photos first
      let photos: { url: string; fileId: string; fileName: string; fileSize: number }[] = [];
      if (pendingPhotos.length > 0) {
        setUploadingPhotos(true);
        photos = await Promise.all(
          pendingPhotos.map(async (p) => {
            const fd = new FormData();
            fd.append("file", p.file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            return {
              url: data.fileUrl,
              fileId: data.fileId,
              fileName: data.fileName,
              fileSize: data.fileSize,
            };
          }),
        );
        setUploadingPhotos(false);
      }

      await fetch(`/api/tasks/${taskId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newUpdate,
          ...(photos.length > 0 ? { photos } : {}),
        }),
      });
      setNewUpdate("");
      // Revoke object URLs
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPendingPhotos([]);
      fetchData();
    } finally {
      setSendingUpdate(false);
      setUploadingPhotos(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle
    }
  }

  const jobScoped = selectedJob
    ? tasks.filter((t) => t.jobId === selectedJob.id)
    : tasks;

  const filtered = jobScoped.filter(
    (t) => statusFilter === "all" || t.status === statusFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted text-sm mt-1">
            Create, assign, and track maintenance tasks.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 p-1 rounded-xl glass w-fit">
        {["all", "pending", "in-progress", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-all ${
              statusFilter === s
                ? "bg-accent/20 text-accent-light font-medium"
                : "text-muted hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-5 w-48 bg-white/5 rounded mb-2" />
              <div className="h-4 w-64 bg-white/3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No tasks found</h3>
          <p className="text-sm text-muted">
            Create your first maintenance task.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const isExpanded = expandedTask === task.id;
            const updates = task.updates
              ? Object.values(task.updates).sort(
                  (a, b) => b.timestamp - a.timestamp,
                )
              : [];

            return (
              <div key={task.id} className="glass-card rounded-xl">
                <div
                  className="p-5 flex items-start gap-4 cursor-pointer"
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{task.title}</h3>
                    </div>
                    {task.equipmentName && task.equipmentId && (
                      <Link
                        href={`/dashboard/equipment/${task.equipmentId}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/20 text-accent-light hover:bg-accent/30 border border-accent/20 hover:border-accent/40 transition-all font-semibold text-base mb-3 w-fit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Wrench className="w-4.5 h-4.5" />
                        {task.equipmentName}
                        <span className="text-xs opacity-60 ml-1">→</span>
                      </Link>
                    )}
                    {task.description && (
                      <p className="text-sm text-muted line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}
                      >
                        {task.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}
                      >
                        <Flag className="w-3 h-3 inline mr-0.5" />
                        {task.priority}
                      </span>
                      {task.homeownerName && (
                        <span className="text-xs text-muted flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.homeownerName}
                        </span>
                      )}
                      <JobBadge jobId={task.jobId} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status dropdown (management only) */}
                    {profile?.role === "management" && (
                      <PillSelect
                        value={task.status}
                        onChange={(val) =>
                          updateStatus(task.id, val as Task["status"])
                        }
                        options={statusOptions}
                        compact
                      />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded: project updates */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-accent-light" />
                        Project Updates
                      </h4>
                      <div className="flex items-center gap-3">
                        {profile?.role === "management" && (
                          <button
                            onClick={() => openEdit(task)}
                            className="text-xs text-accent-light hover:underline flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-xs text-danger hover:underline"
                        >
                          Delete Task
                        </button>
                      </div>
                    </div>

                    {/* Updates list */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {updates.length === 0 ? (
                        <p className="text-sm text-muted">No updates yet.</p>
                      ) : (
                        updates.map((update) => (
                          <div key={update.id} className="glass rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">
                                {update.authorName}
                                <span
                                  className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                                    update.authorRole === "management"
                                      ? "bg-accent/10 text-accent-light"
                                      : "bg-success/10 text-success"
                                  }`}
                                >
                                  {update.authorRole}
                                </span>
                              </span>
                              <span className="text-[10px] text-muted">
                                {new Date(
                                  update.timestamp,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted">
                              {update.message}
                            </p>
                            {update.photos && update.photos.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {update.photos.map((photo, idx) => (
                                  <button
                                    key={photo.fileId}
                                    type="button"
                                    onClick={() => {
                                      setLightboxPhotos(update.photos!.map((p) => p.url));
                                      setLightboxIndex(idx);
                                    }}
                                    className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/10 hover:ring-accent/50 transition-all cursor-zoom-in"
                                  >
                                    <Image
                                      src={photo.url}
                                      alt="Comment photo"
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pending photo previews */}
                    {pendingPhotos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {pendingPhotos.map((p, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/10">
                            <Image
                              src={p.preview}
                              alt="Pending upload"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <button
                              type="button"
                              onClick={() => {
                                URL.revokeObjectURL(p.preview);
                                setPendingPhotos((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add update input */}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const newPending = files.map((f) => ({
                          file: f,
                          preview: URL.createObjectURL(f),
                        }));
                        setPendingPhotos((prev) => [...prev, ...newPending].slice(0, 10));
                        e.target.value = "";
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="p-2 rounded-xl glass text-muted hover:text-foreground transition-colors shrink-0"
                        title="Attach photos"
                      >
                        <ImagePlus className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        placeholder="Add a project update..."
                        className="glass-input flex-1 rounded-xl px-4 py-2 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            sendProjectUpdate(task.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => sendProjectUpdate(task.id)}
                        disabled={!newUpdate.trim() || sendingUpdate || uploadingPhotos}
                        className="btn-primary px-3 py-2 disabled:opacity-50"
                      >
                        {uploadingPhotos ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingTaskId ? "Edit Task" : "New Task"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Fix kitchen faucet leak"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Priority
                  </label>
                  <PillSelect
                    value={form.priority}
                    onChange={(val) =>
                      setForm({ ...form, priority: val as Task["priority"] })
                    }
                    options={priorityOptions}
                  />
                </div>
                {editingTaskId && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Status
                    </label>
                    <PillSelect
                      value={form.status}
                      onChange={(val) =>
                        setForm({ ...form, status: val as Task["status"] })
                      }
                      options={statusOptions}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Equipment
                </label>
                <select
                  value={form.equipmentId}
                  onChange={(e) =>
                    setForm({ ...form, equipmentId: e.target.value })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="" className="bg-[#0f172a]">
                    None
                  </option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id} className="bg-[#0f172a]">
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Homeowner selection (management only) */}
              {profile?.role === "management" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Homeowner
                  </label>
                  <HomeownerSearch
                    onSelect={(hw) => {
                      setSelectedHomeowner(hw);
                      setForm({ ...form, homeownerId: hw?.id || "" });
                    }}
                    selectedHomeowner={selectedHomeowner}
                  />
                </div>
              )}

              {/* Job selection (management only) */}
              {profile?.role === "management" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Job
                  </label>
                  <select
                    value={form.jobId}
                    onChange={(e) =>
                      setForm({ ...form, jobId: e.target.value })
                    }
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="" className="bg-[#0f172a]">
                      None
                    </option>
                    {jobs.map((job) => (
                      <option
                        key={job.id}
                        value={job.id}
                        className="bg-[#0f172a]"
                      >
                        {job.title}
                        {job.homeownerName ? ` — ${job.homeownerName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving
                    ? editingTaskId
                      ? "Saving..."
                      : "Creating..."
                    : editingTaskId
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
