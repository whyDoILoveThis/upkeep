"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "../layout";
import {
  Plus,
  Search,
  Wrench,
  X,
  Pencil,
  Trash2,
  Hash,
  Factory,
  MapPin,
  Copy,
} from "lucide-react";
import type { EquipmentTemplate } from "@/lib/types";

const categories = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Appliance",
  "Roofing",
  "Landscaping",
  "Security",
  "Other",
];

export default function DefaultEquipmentPage() {
  const { profile } = useProfile();
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Appliance",
    modelNo: "",
    manufacturer: "",
    location: "",
    notes: "",
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/equipment-templates");
      if (res.ok) setTemplates(await res.json());
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function resetForm() {
    setForm({
      name: "",
      category: "Appliance",
      modelNo: "",
      manufacturer: "",
      location: "",
      notes: "",
    });
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(t: EquipmentTemplate) {
    setForm({
      name: t.name,
      category: t.category,
      modelNo: t.modelNo || "",
      manufacturer: t.manufacturer || "",
      location: t.location || "",
      notes: t.notes || "",
    });
    setEditingId(t.id);
    setShowModal(true);
  }

  function duplicateTemplate(t: EquipmentTemplate) {
    setForm({
      name: `${t.name} (Copy)`,
      category: t.category,
      modelNo: t.modelNo || "",
      manufacturer: t.manufacturer || "",
      location: t.location || "",
      notes: t.notes || "",
    });
    setEditingId(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId
        ? `/api/equipment-templates/${editingId}`
        : "/api/equipment-templates";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchTemplates();
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      await fetch(`/api/equipment-templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch {
      // handle
    }
  }

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.manufacturer || "").toLowerCase().includes(search.toLowerCase()),
  );

  if (profile?.role !== "management") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted">
          Default equipment is only available for management accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-accent-light" />
            Default Equipment
          </h1>
          <p className="text-muted text-sm mt-1">
            Create equipment templates to quickly add to any job.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
              <div className="h-5 w-40 bg-white/5 rounded mb-3" />
              <div className="h-4 w-24 bg-white/5 rounded mb-2" />
              <div className="h-4 w-32 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Wrench className="w-12 h-12 text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No templates yet</h3>
          <p className="text-muted text-sm">
            {search
              ? "Try a different search."
              : "Create your first equipment template."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="glass-card rounded-2xl p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{t.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light font-medium mt-1 inline-block">
                    {t.category}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <button
                    onClick={() => duplicateTemplate(t)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted" />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted">
                {t.manufacturer && (
                  <div className="flex items-center gap-2">
                    <Factory className="w-3.5 h-3.5" /> {t.manufacturer}
                  </div>
                )}
                {t.modelNo && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> {t.modelNo}
                  </div>
                )}
                {t.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> {t.location}
                  </div>
                )}
              </div>

              {t.notes && (
                <p className="text-xs text-muted mt-3 line-clamp-2">
                  {t.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Template" : "New Template"}
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
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Central HVAC System"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-[#0f172a]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Model No.
                  </label>
                  <input
                    type="text"
                    value={form.modelNo}
                    onChange={(e) =>
                      setForm({ ...form, modelNo: e.target.value })
                    }
                    placeholder="TR-XL18i"
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={(e) =>
                      setForm({ ...form, manufacturer: e.target.value })
                    }
                    placeholder="Trane"
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Default Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Basement, Kitchen, etc."
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Maintenance notes, default reminders, etc."
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                />
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
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update"
                      : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
