"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "../layout";
import { useSelectedJob } from "@/lib/job-context";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  X,
  MapPin,
  Clock,
  ChevronRight,
  Wrench,
  ClipboardList,
  Receipt,
  Search,
  Trash2,
  AlertTriangle,
  Building2,
  User,
} from "lucide-react";
import type {
  Job,
  UserProfile,
  Equipment,
  Task,
  BillingRecord,
} from "@/lib/types";
import HomeownerSearch from "@/components/homeowner-search";

export default function JobsPage() {
  const { profile } = useProfile();
  const { selectedJob, setSelectedJob } = useSelectedJob();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "active" | "paused" | "completed"
  >("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Homeowner search state for the modal
  const [selectedHomeowner, setSelectedHomeowner] =
    useState<UserProfile | null>(null);

  const [form, setForm] = useState({
    homeownerId: "",
    title: "",
    address: "",
    notes: "",
  });

  const isManagement = profile?.role === "management";

  const fetchData = useCallback(async () => {
    try {
      const fetches: Promise<Response>[] = [fetch("/api/jobs")];

      if (profile?.role === "management") {
        fetches.push(
          fetch("/api/equipment"),
          fetch("/api/tasks"),
          fetch("/api/billing"),
        );
      }

      const responses = await Promise.all(fetches);
      const [jobsRes, eqRes, tasksRes, billsRes] = responses;
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (eqRes?.ok) setEquipment(await eqRes.json());
      if (tasksRes?.ok) setTasks(await tasksRes.json());
      if (billsRes?.ok) setBills(await billsRes.json());
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [profile?.role]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  function selectHomeowner(hw: UserProfile | null) {
    setSelectedHomeowner(hw);
    if (hw) {
      setForm((f) => ({
        ...f,
        homeownerId: hw.id,
        title: f.title || `${hw.name.split(" ").pop()} Residence`,
        address: f.address || hw.address || "",
      }));
    } else {
      setForm((f) => ({ ...f, homeownerId: "" }));
    }
  }

  function getJobStats(job: Job) {
    const jobEquipment = equipment.filter((e) => e.userId === job.homeownerId);
    const jobTasks = tasks.filter((t) => t.homeownerId === job.homeownerId);
    const jobBills = bills.filter((b) => b.homeownerId === job.homeownerId);
    const activeTasks = jobTasks.filter((t) => t.status !== "completed").length;
    const pendingBills = jobBills.filter(
      (b) => b.status === "pending" || b.status === "overdue",
    ).length;
    return { equipmentCount: jobEquipment.length, activeTasks, pendingBills };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ homeownerId: "", title: "", address: "", notes: "" });
        setSelectedHomeowner(null);
        fetchData();
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !deleteConfirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedJob?.id === deleteTarget.id) setSelectedJob(null);
        setDeleteTarget(null);
        setDeleteConfirmed(false);
        fetchData();
      }
    } catch {
      // handle
    } finally {
      setDeleting(false);
    }
  }

  const filteredJobs = jobs
    .filter((j) => filter === "all" || j.status === filter)
    .filter(
      (j) =>
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.homeownerName?.toLowerCase().includes(search.toLowerCase()) ||
        j.address?.toLowerCase().includes(search.toLowerCase()),
    );

  if (!isManagement && profile?.role !== "homeowner") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted">Please complete onboarding first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-accent-light" />
            {isManagement ? "Jobs" : "My Jobs"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {isManagement
              ? "Manage all your properties and clients."
              : "Properties managed on your behalf."}
          </p>
        </div>
        {isManagement && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Job
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-1 glass rounded-xl p-1">
          {(["all", "active", "paused", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === s
                  ? "bg-accent/20 text-accent-light"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
              <div className="h-5 w-40 bg-white/5 rounded mb-3" />
              <div className="h-4 w-60 bg-white/5 rounded mb-6" />
              <div className="flex gap-4">
                <div className="h-8 w-16 bg-white/5 rounded" />
                <div className="h-8 w-16 bg-white/5 rounded" />
                <div className="h-8 w-16 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-muted/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">No jobs found</h3>
          <p className="text-muted text-sm">
            {jobs.length === 0
              ? "Create your first job to start managing properties."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const stats = getJobStats(job);
            const isSelected = selectedJob?.id === job.id;
            return (
              <button
                key={job.id}
                onClick={() => {
                  setSelectedJob(job);
                  router.push("/dashboard");
                }}
                className={`glass-card rounded-2xl p-6 group text-left w-full transition-all ${
                  isSelected ? "ring-2 ring-accent/50" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {job.title}
                    </h3>
                    {job.homeownerName && (
                      <p className="text-sm text-muted truncate">
                        <User className="w-3 h-3 inline mr-1" />
                        {job.homeownerName}
                      </p>
                    )}
                    {job.managementName && (
                      <p className="text-sm text-muted truncate">
                        <Building2 className="w-3 h-3 inline mr-1" />
                        {job.managementName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-3 ${
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

                {job.address && (
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{job.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  {isManagement && (
                    <>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Wrench className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-muted">
                          {stats.equipmentCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-muted">{stats.activeTasks}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Receipt className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-muted">{stats.pendingBills}</span>
                      </div>
                    </>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {job.notes && (
                  <p className="text-xs text-muted mt-3 line-clamp-2">
                    {job.notes}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted/60">
                    <Clock className="w-3 h-3" />
                    Updated{" "}
                    {new Date(job.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {isManagement && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(job);
                        setDeleteConfirmed(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          setDeleteTarget(job);
                          setDeleteConfirmed(false);
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted/40 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New Job Modal */}
      {showModal && isManagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">New Job</h2>
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
                  Homeowner *
                </label>
                <HomeownerSearch
                  onSelect={selectHomeowner}
                  selectedHomeowner={selectedHomeowner}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g., Rivera Residence"
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
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Property address"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Any details about this job..."
                  rows={3}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Job"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm glass-strong rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Delete Job</h2>
                <p className="text-sm text-muted">This cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete{" "}
              <span className="text-foreground font-medium">
                {deleteTarget.title}
              </span>
              ? This will permanently remove the job record.
            </p>

            <label className="flex items-start gap-2.5 mb-5 cursor-pointer group">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-red-500"
              />
              <span className="text-sm text-muted group-hover:text-foreground transition-colors">
                I understand this action is permanent and cannot be reversed.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl glass text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteConfirmed || deleting}
                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
