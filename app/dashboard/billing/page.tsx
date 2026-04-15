"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "../layout";
import {
  Plus,
  Receipt,
  DollarSign,
  Calendar,
  User,
  X,
  CheckCircle2,
} from "lucide-react";
import type { BillingRecord, UserProfile } from "@/lib/types";
import { useSelectedJob } from "@/lib/job-context";
import { JobRequired } from "@/components/job-required";

const statusColors: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-400",
  paid: "bg-success/10 text-success",
  overdue: "bg-red-400/10 text-red-400",
};

export default function BillingPage() {
  const { profile } = useProfile();
  const { selectedJob } = useSelectedJob();
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [homeowners, setHomeowners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [form, setForm] = useState({
    description: "",
    amount: "",
    dueDate: "",
    homeownerId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}`
        : "";
      const endpoints = [`/api/billing${params}`];
      if (profile?.role === "management")
        endpoints.push("/api/users/homeowners");

      const responses = await Promise.all(endpoints.map((url) => fetch(url)));
      if (responses[0].ok) setBills(await responses[0].json());
      if (responses[1]?.ok) setHomeowners(await responses[1].json());
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [profile?.role, selectedJob]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ description: "", amount: "", dueDate: "", homeownerId: "" });
        fetchData();
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  }

  async function markAsPaid(id: string) {
    try {
      await fetch(`/api/billing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paidDate: new Date().toISOString().split("T")[0],
        }),
      });
      fetchData();
    } catch {
      // handle
    }
  }

  const jobScoped =
    profile?.role === "management" && selectedJob
      ? bills.filter((b) => b.homeownerId === selectedJob.homeownerId)
      : bills;

  const filtered = jobScoped.filter(
    (b) => statusFilter === "all" || b.status === statusFilter,
  );

  const totalPending = jobScoped
    .filter((b) => b.status === "pending" || b.status === "overdue")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = jobScoped
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  if (profile?.role === "management" && !selectedJob) {
    return <JobRequired />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Billing & Payments
          </h1>
          <p className="text-muted text-sm mt-1">
            Track invoices and payment status.
          </p>
        </div>
        {profile?.role === "management" && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm text-muted mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-amber-400">
            $
            {totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm text-muted mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-success">
            ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm text-muted mb-1">Total Invoices</div>
          <div className="text-2xl font-bold">{bills.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 rounded-xl glass w-fit">
        {["all", "pending", "paid", "overdue"].map((s) => (
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

      {/* Bills list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-5 w-48 bg-white/5 rounded mb-2" />
              <div className="h-4 w-32 bg-white/3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Receipt className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No billing records</h3>
          <p className="text-sm text-muted">
            {profile?.role === "management"
              ? "Create your first invoice."
              : "No invoices yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((bill) => (
            <div
              key={bill.id}
              className="glass-card rounded-xl p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-accent-light" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium">{bill.description}</div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(bill.dueDate).toLocaleDateString()}
                  </span>
                  {bill.homeownerName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {bill.homeownerName}
                    </span>
                  )}
                  {bill.paidDate && (
                    <span className="text-success">
                      Paid: {new Date(bill.paidDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-lg font-bold">
                  $
                  {bill.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[bill.status]}`}
                >
                  {bill.status}
                </span>
              </div>

              {profile?.role === "management" && bill.status !== "paid" && (
                <button
                  onClick={() => markAsPaid(bill.id)}
                  className="p-2 rounded-lg hover:bg-success/10 text-success transition-colors shrink-0"
                  title="Mark as paid"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Invoice Modal (management only) */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">New Invoice</h2>
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
                  Description <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="e.g., Q1 Maintenance Service"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    placeholder="250.00"
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Homeowner <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={form.homeownerId}
                  onChange={(e) =>
                    setForm({ ...form, homeownerId: e.target.value })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="" className="bg-[#0f172a]">
                    Select homeowner
                  </option>
                  {homeowners.map((h) => (
                    <option key={h.id} value={h.id} className="bg-[#0f172a]">
                      {h.name}
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
                  {saving ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
