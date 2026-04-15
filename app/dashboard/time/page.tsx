"use client";

import { useEffect, useState, useRef } from "react";
import { useProfile } from "../layout";
import {
  Hammer,
  Plus,
  X,
  Trash2,
  Calendar,
  Clock,
  User,
  Pencil,
} from "lucide-react";
import { HandymanTimeRing } from "@/components/handyman-time-ring";
import type { HandymanTime, UserProfile } from "@/lib/types";
import { useDemoMode } from "@/lib/demo-context";
import { useSelectedJob } from "@/lib/job-context";
import { JobRequired } from "@/components/job-required";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";

function getFirebaseDb() {
  const app =
    getApps().length === 0
      ? initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        })
      : getApp();
  return getDatabase(app);
}

function getQuarterDates() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), quarter * 3, 1);
  const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  return { quarterStart: start.toISOString(), quarterEnd: end.toISOString() };
}

function minutesBetween(a: string, b: string) {
  return Math.max(
    0,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000),
  );
}

export default function HandymanTimePage() {
  const { profile } = useProfile();
  const { demoMode, demoRole } = useDemoMode();
  const { selectedJob } = useSelectedJob();
  const [entries, setEntries] = useState<HandymanTime[]>([]);
  const [homeowners, setHomeowners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const listenerRef = useRef<ReturnType<typeof dbRef> | null>(null);

  const isManagement =
    profile?.role === "management" || demoRole === "management";

  const [form, setForm] = useState({
    userId: "",
    startDate: "",
    startTimeVal: "",
    endDate: "",
    endTimeVal: "",
    notes: "",
  });

  // Real-time Firebase listener
  useEffect(() => {
    if (!profile && !demoMode) return;

    const db = getFirebaseDb();
    const htRef = dbRef(db, "handymanTime");

    onValue(htRef, (snapshot) => {
      if (!snapshot.exists()) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const all = Object.entries(
        snapshot.val() as Record<string, Omit<HandymanTime, "id">>,
      ).map(([id, data]) => ({ id, ...data }));

      // Filter based on role
      let filtered: HandymanTime[];
      if (demoMode) {
        const role = demoRole;
        if (role === "management") {
          filtered = all.filter((e) => e.managementId === "demo-management");
        } else {
          filtered = all.filter((e) => e.userId === "demo-homeowner");
        }
      } else if (profile?.role === "management") {
        filtered = all.filter((e) => e.managementId === profile.id);
      } else {
        filtered = all.filter((e) => e.userId === profile?.id);
      }

      filtered.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
      setEntries(filtered);
      setLoading(false);
    });

    listenerRef.current = htRef;

    return () => {
      if (listenerRef.current) {
        off(listenerRef.current);
      }
    };
  }, [profile, demoMode, demoRole]);

  // Fetch homeowners for management
  useEffect(() => {
    if (!isManagement) return;
    fetch("/api/users/homeowners")
      .then((res) => (res.ok ? res.json() : []))
      .then(setHomeowners)
      .catch(() => {});
  }, [isManagement]);

  // Filter to selected job
  const scopedEntries =
    isManagement && selectedJob
      ? entries.filter((e) => e.userId === selectedJob.homeownerId)
      : entries;

  const { quarterStart, quarterEnd } = getQuarterDates();
  const quarterEntries = scopedEntries.filter((e) => {
    const s = new Date(e.startTime);
    return s >= new Date(quarterStart) && s <= new Date(quarterEnd);
  });

  const totalMinutes = quarterEntries.reduce(
    (sum, e) => sum + minutesBetween(e.startTime, e.endTime),
    0,
  );
  const pastMinutes = quarterEntries.reduce((sum, e) => {
    if (new Date(e.endTime) <= new Date()) {
      return sum + minutesBetween(e.startTime, e.endTime);
    }
    return sum;
  }, 0);

  function resetForm() {
    setForm({
      userId: "",
      startDate: "",
      startTimeVal: "",
      endDate: "",
      endTimeVal: "",
      notes: "",
    });
    setEditingId(null);
  }

  function openEdit(entry: HandymanTime) {
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    setForm({
      userId: entry.userId,
      startDate: start.toISOString().slice(0, 10),
      startTimeVal: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().slice(0, 10),
      endTimeVal: end.toTimeString().slice(0, 5),
      notes: entry.notes || "",
    });
    setEditingId(entry.id);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startTime = new Date(
      `${form.startDate}T${form.startTimeVal}`,
    ).toISOString();
    const endTime = new Date(
      `${form.endDate}T${form.endTimeVal}`,
    ).toISOString();

    const targetUserId = isManagement ? form.userId : profile?.id || "";

    setSaving(true);
    try {
      const url = editingId
        ? `/api/time-allotment/${editingId}`
        : "/api/time-allotment";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          startTime,
          endTime,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/time-allotment/${id}`, { method: "DELETE" });
    } catch {
      // handle
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="glass-card rounded-2xl p-12 animate-pulse flex justify-center">
          <div className="w-50 h-50 rounded-full bg-white/5" />
        </div>
      </div>
    );
  }

  if (isManagement && !selectedJob && !demoMode) {
    return <JobRequired />;
  }

  const scopedHomeowners = selectedJob
    ? homeowners.filter((h) => h.id === selectedJob.homeownerId)
    : homeowners;

  function getHomeownerName(userId: string) {
    return homeowners.find((h) => h.id === userId)?.name || userId;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="w-6 h-6 text-accent-light" />
            Handyman Time
          </h1>
          <p className="text-muted text-sm mt-1">
            {isManagement
              ? "Schedule and track handyman time for homeowners."
              : "Your scheduled handyman time this quarter."}
          </p>
        </div>
        {isManagement && (
          <button
            onClick={() => {
              resetForm();
              if (selectedJob)
                setForm((f) => ({ ...f, userId: selectedJob.homeownerId }));
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Time
          </button>
        )}
      </div>

      {/* Quarterly Ring */}
      <div className="max-w-md mx-auto">
        <div className="glass-card rounded-2xl p-8">
          <HandymanTimeRing
            scheduledMinutes={totalMinutes}
            completedMinutes={pastMinutes}
            quarterStart={quarterStart}
            quarterEnd={quarterEnd}
          />
        </div>
      </div>

      {/* Entries List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Scheduled Entries</h2>
        {scopedEntries.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Hammer className="w-12 h-12 text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No time scheduled</h3>
            <p className="text-muted text-sm">
              {isManagement
                ? "Schedule handyman time for this homeowner."
                : "No handyman time has been scheduled yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scopedEntries.map((entry) => {
              const start = new Date(entry.startTime);
              const end = new Date(entry.endTime);
              const duration = minutesBetween(entry.startTime, entry.endTime);
              const isPast = end <= new Date();
              const isActive = start <= new Date() && end > new Date();

              return (
                <div
                  key={entry.id}
                  className={`glass-card rounded-xl p-4 flex items-center gap-4 ${
                    isPast
                      ? "opacity-60"
                      : isActive
                        ? "ring-2 ring-accent/40"
                        : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPast
                        ? "bg-white/5"
                        : isActive
                          ? "bg-accent/20"
                          : "bg-accent/10"
                    }`}
                  >
                    <Clock
                      className={`w-5 h-5 ${isPast ? "text-muted" : "text-accent-light"}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {start.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-muted">
                        {start.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {end.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light font-medium">
                        {Math.floor(duration / 60)}h {duration % 60}m
                      </span>
                      {isPast && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted font-medium">
                          Completed
                        </span>
                      )}
                      {isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                    {isManagement && (
                      <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getHomeownerName(entry.userId)}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted/70 mt-1 truncate">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  {isManagement && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(entry)}
                        className="p-2 rounded-lg hover:bg-accent/20 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-muted hover:text-accent-light" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-muted hover:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Handyman Time" : "Schedule Handyman Time"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isManagement && !selectedJob && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Homeowner *
                  </label>
                  <select
                    value={form.userId}
                    onChange={(e) =>
                      setForm({ ...form, userId: e.target.value })
                    }
                    required
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">Select homeowner</option>
                    {scopedHomeowners.map((h) => (
                      <option key={h.id} value={h.id} className="bg-[#0f172a]">
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="glass rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Start
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                          endDate: f.endDate || e.target.value,
                        }));
                      }}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={form.startTimeVal}
                      onChange={(e) =>
                        setForm({ ...form, startTimeVal: e.target.value })
                      }
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> End
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                      min={form.startDate}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={form.endTimeVal}
                      onChange={(e) =>
                        setForm({ ...form, endTimeVal: e.target.value })
                      }
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Notes
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g., Fix kitchen faucet"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                {saving
                  ? editingId
                    ? "Saving..."
                    : "Scheduling..."
                  : editingId
                    ? "Save Changes"
                    : "Schedule"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
