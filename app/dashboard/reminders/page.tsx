"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Bell,
  Calendar,
  Repeat,
  Link as LinkIcon,
  X,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Reminder, Equipment } from "@/lib/types";
import { useSelectedJob } from "@/lib/job-context";
import { useProfile } from "../layout";
import { JobRequired } from "@/components/job-required";

export default function RemindersPage() {
  const { profile } = useProfile();
  const { selectedJob } = useSelectedJob();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    recurring: "none" as Reminder["recurring"],
    equipmentId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}`
        : "";
      const [remRes, eqRes] = await Promise.all([
        fetch(`/api/reminders${params}`),
        fetch(`/api/equipment${params}`),
      ]);
      if (remRes.ok) setReminders(await remRes.json());
      if (eqRes.ok) setEquipment(await eqRes.json());
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetForm() {
    setForm({
      title: "",
      description: "",
      dueDate: "",
      recurring: "none",
      equipmentId: "",
    });
    setEditingId(null);
  }

  function openEdit(item: Reminder) {
    setForm({
      title: item.title,
      description: item.description || "",
      dueDate: item.dueDate,
      recurring: item.recurring,
      equipmentId: item.equipmentId || "",
    });
    setEditingId(item.id);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/reminders/${editingId}` : "/api/reminders";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      fetchData();
    } catch {
      // handle error
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this reminder?")) return;
    try {
      await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  }

  const jobScoped =
    profile?.role === "management" && selectedJob
      ? reminders.filter((r) => r.userId === selectedJob.homeownerId)
      : reminders;

  const filtered = jobScoped.filter((r) => {
    if (filter === "completed") return r.completed;
    if (filter === "upcoming") return !r.completed;
    return true;
  });

  const sortedReminders = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (profile?.role === "management" && !selectedJob) {
    return <JobRequired />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
          <p className="text-muted text-sm mt-1">
            Schedule and track maintenance reminders.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Reminder
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl glass w-fit">
        {(["all", "upcoming", "completed"] as const).map((f) => (
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
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-5 w-48 bg-white/5 rounded mb-2" />
              <div className="h-4 w-32 bg-white/3 rounded" />
            </div>
          ))}
        </div>
      ) : sortedReminders.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bell className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No reminders</h3>
          <p className="text-sm text-muted">
            Create your first maintenance reminder.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedReminders.map((reminder) => {
            const isOverdue =
              !reminder.completed && new Date(reminder.dueDate) < new Date();

            return (
              <div
                key={reminder.id}
                className={`glass-card rounded-xl p-5 flex items-start gap-4 group ${
                  reminder.completed ? "opacity-50" : ""
                }`}
              >
                <button
                  onClick={() =>
                    toggleComplete(reminder.id, reminder.completed)
                  }
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    reminder.completed
                      ? "bg-success border-success"
                      : "border-muted hover:border-success"
                  }`}
                >
                  {reminder.completed && <Check className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium ${reminder.completed ? "line-through" : ""}`}
                  >
                    {reminder.title}
                  </div>
                  {reminder.description && (
                    <p className="text-sm text-muted mt-0.5">
                      {reminder.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted">
                    <span
                      className={`flex items-center gap-1 ${isOverdue ? "text-danger" : ""}`}
                    >
                      <Calendar className="w-3 h-3" />
                      {new Date(reminder.dueDate).toLocaleDateString()}
                      {isOverdue && " (overdue)"}
                    </span>
                    {reminder.recurring !== "none" && (
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" /> {reminder.recurring}
                      </span>
                    )}
                    {reminder.equipmentName && (
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />{" "}
                        {reminder.equipmentName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(reminder)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted" />
                  </button>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Reminder" : "New Reminder"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
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
                  placeholder="e.g., Replace HVAC filter"
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
                  rows={2}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Due Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Recurring
                  </label>
                  <select
                    value={form.recurring}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurring: e.target.value as Reminder["recurring"],
                      })
                    }
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="none" className="bg-[#0f172a]">
                      None
                    </option>
                    <option value="weekly" className="bg-[#0f172a]">
                      Weekly
                    </option>
                    <option value="monthly" className="bg-[#0f172a]">
                      Monthly
                    </option>
                    <option value="quarterly" className="bg-[#0f172a]">
                      Quarterly
                    </option>
                    <option value="yearly" className="bg-[#0f172a]">
                      Yearly
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Link to Equipment
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Add Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
