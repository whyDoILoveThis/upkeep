"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Wrench,
  Calendar,
  Shield,
  MapPin,
  Hash,
  Factory,
  X,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileDown,
} from "lucide-react";
import type { Equipment, EquipmentTemplate } from "@/lib/types";
import Image from "next/image";
import { useSelectedJob } from "@/lib/job-context";
import { useProfile } from "../layout";
import { JobBadge } from "@/components/job-badge";

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

export default function EquipmentPage() {
  const { profile } = useProfile();
  const { selectedJob } = useSelectedJob();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Appliance",
    datePurchased: "",
    warrantyExpiration: "",
    modelNo: "",
    serialNo: "",
    manufacturer: "",
    location: "",
    notes: "",
  });

  const fetchEquipment = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}`
        : "";
      const res = await fetch(`/api/equipment${params}`);
      if (res.ok) {
        const data = await res.json();
        setEquipment(data);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    async function fetchTemplates() {
      if (profile?.role !== "management") return;
      try {
        const res = await fetch("/api/equipment-templates");
        if (res.ok) setTemplates(await res.json());
      } catch {
        // handle
      }
    }
    fetchTemplates();
  }, [profile?.role]);

  function resetForm() {
    setForm({
      name: "",
      category: "Appliance",
      datePurchased: "",
      warrantyExpiration: "",
      modelNo: "",
      serialNo: "",
      manufacturer: "",
      location: "",
      notes: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openFromTemplate(t: EquipmentTemplate) {
    resetForm();
    setForm({
      name: t.name,
      category: t.category,
      datePurchased: "",
      warrantyExpiration: "",
      modelNo: t.modelNo || "",
      serialNo: "",
      manufacturer: t.manufacturer || "",
      location: t.location || "",
      notes: t.notes || "",
    });
    setShowTemplatePicker(false);
    setShowModal(true);
  }

  function openEdit(item: Equipment) {
    setForm({
      name: item.name,
      category: item.category,
      datePurchased: item.datePurchased || "",
      warrantyExpiration: item.warrantyExpiration || "",
      modelNo: item.modelNo || "",
      serialNo: item.serialNo || "",
      manufacturer: item.manufacturer || "",
      location: item.location || "",
      notes: item.notes || "",
    });
    setPhotoPreview(item.photoUrl || null);
    setEditingId(item.id);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let photoUrl = photoPreview;
      let photoFileId: string | undefined;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.fileUrl;
          photoFileId = uploadData.fileId;
        }
      }

      const body = { ...form, photoUrl, photoFileId };
      const url = editingId ? `/api/equipment/${editingId}` : "/api/equipment";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchEquipment();
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this equipment?")) return;
    try {
      await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      fetchEquipment();
    } catch {
      // handle error
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File must be under 10MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  const jobScoped = selectedJob
    ? equipment.filter((e) => e.jobId === selectedJob.id)
    : equipment;

  const filtered = jobScoped.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.manufacturer || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.location || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Equipment Inventory
          </h1>
          <p className="text-muted text-sm mt-1">
            Track all your home equipment, appliances, and systems.
          </p>
        </div>
        <div className="flex gap-2">
          {profile?.role === "management" && templates.length > 0 && (
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="btn-secondary flex items-center gap-2 whitespace-nowrap text-sm"
            >
              <FileDown className="w-4 h-4" /> From Template
            </button>
          )}
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search equipment..."
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
              <div className="w-full h-32 rounded-xl bg-white/5 mb-4" />
              <div className="h-5 w-40 bg-white/5 rounded mb-2" />
              <div className="h-4 w-24 bg-white/3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Wrench className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No equipment found</h3>
          <p className="text-sm text-muted">
            {search
              ? "Try a different search term."
              : "Add your first piece of equipment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl overflow-hidden group"
            >
              {/* Photo */}
              <div className="relative h-40 bg-linear-to-br from-white/3 to-white/1 flex items-center justify-center">
                {item.photoUrl ? (
                  <Image
                    src={item.photoUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Wrench className="w-10 h-10 text-muted/30" />
                )}
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-black/60 text-foreground/80 font-medium">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <JobBadge jobId={item.jobId} />
                </div>

                <div className="space-y-1.5 text-xs text-muted">
                  {item.manufacturer && (
                    <div className="flex items-center gap-2">
                      <Factory className="w-3.5 h-3.5" /> {item.manufacturer}
                    </div>
                  )}
                  {item.modelNo && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5" /> {item.modelNo}
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> {item.location}
                    </div>
                  )}
                  {item.warrantyExpiration && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> Warranty:{" "}
                      {new Date(item.warrantyExpiration).toLocaleDateString()}
                    </div>
                  )}
                  {item.datePurchased && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Purchased:{" "}
                      {new Date(item.datePurchased).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
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
                {editingId ? "Edit Equipment" : "Add Equipment"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl bg-white/5 border border-border flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted" />
                    )}
                  </div>
                  <label className="btn-secondary text-sm cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Samsung Refrigerator"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              {/* Category */}
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

              {/* Two-column grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Date Purchased
                  </label>
                  <input
                    type="date"
                    value={form.datePurchased}
                    onChange={(e) =>
                      setForm({ ...form, datePurchased: e.target.value })
                    }
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Warranty Expiration
                  </label>
                  <input
                    type="date"
                    value={form.warrantyExpiration}
                    onChange={(e) =>
                      setForm({ ...form, warrantyExpiration: e.target.value })
                    }
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
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
                    placeholder="RF28R7351SR"
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Serial No.
                  </label>
                  <input
                    type="text"
                    value={form.serialNo}
                    onChange={(e) =>
                      setForm({ ...form, serialNo: e.target.value })
                    }
                    placeholder="SN123456789"
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
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
                  placeholder="Samsung"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Kitchen, Garage, etc."
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
                  placeholder="Additional notes..."
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
                      : "Add Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowTemplatePicker(false)}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Choose a Template</h2>
              <button
                onClick={() => setShowTemplatePicker(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openFromTemplate(t)}
                  className="w-full text-left glass-card rounded-xl p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{t.name}</div>
                      <div className="text-xs text-muted flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-light font-medium">
                          {t.category}
                        </span>
                        {t.manufacturer && <span>{t.manufacturer}</span>}
                        {t.modelNo && <span>{t.modelNo}</span>}
                      </div>
                    </div>
                    <FileDown className="w-4 h-4 text-muted shrink-0 ml-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
