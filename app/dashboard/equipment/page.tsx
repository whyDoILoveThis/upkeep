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
  FileDown,
} from "lucide-react";
import type { Equipment, EquipmentTemplate, EquipmentPhoto } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useSelectedJob } from "@/lib/job-context";
import { useProfile } from "../layout";
import { JobBadge } from "@/components/job-badge";
import { PhotoLightbox } from "@/components/photo-lightbox";

/** Get all photo URLs from equipment, handling legacy single-photo and Firebase object format */
function getPhotoUrls(item: Equipment): string[] {
  const photos = normalizePhotos(item);
  return photos.map((p) => p.url);
}

function normalizePhotos(item: Equipment): EquipmentPhoto[] {
  if (item.photos) {
    const arr = Array.isArray(item.photos)
      ? item.photos
      : (Object.values(item.photos) as EquipmentPhoto[]);
    if (arr.length > 0) return arr;
  }
  if (item.photoUrl)
    return [{ url: item.photoUrl, fileId: item.photoFileId || "" }];
  return [];
}

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
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<EquipmentPhoto[]>([]);
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    setNewPhotoFiles([]);
    setExistingPhotos([]);
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
    // Load existing photos
    const photos = normalizePhotos(item);
    setExistingPhotos(photos);
    setNewPhotoFiles([]);
    setEditingId(item.id);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload new photos
      const uploadedPhotos: EquipmentPhoto[] = [];
      const uploadedMeta: { url: string; fileId: string; fileName: string; fileSize: number }[] = [];
      for (const file of newPhotoFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedPhotos.push({ url: data.fileUrl, fileId: data.fileId });
          uploadedMeta.push({ url: data.fileUrl, fileId: data.fileId, fileName: file.name, fileSize: file.size });
        }
      }

      const photos = [...existingPhotos, ...uploadedPhotos];

      const body = { ...form, photos };
      const url = editingId ? `/api/equipment/${editingId}` : "/api/equipment";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const saved = await res.json();
        const eqId = editingId || saved.id;

        // Register new photos as file records
        if (uploadedMeta.length > 0) {
          fetch("/api/equipment-photo-files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              equipmentId: eqId,
              equipmentName: form.name,
              jobId: (saved as Record<string, unknown>).jobId || null,
              photos: uploadedMeta,
            }),
          }).catch(() => {});
        }

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
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        alert(`${f.name} is over 10MB and was skipped.`);
        return false;
      }
      return true;
    });
    setNewPhotoFiles((prev) => [...prev, ...valid]);
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewPhoto(index: number) {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function openLightbox(photos: string[], index: number) {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
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
          {filtered.map((item) => {
            const photos = getPhotoUrls(item);
            return (
              <Link
                href={`/dashboard/equipment/${item.id}`}
                key={item.id}
                className="glass-card rounded-2xl overflow-hidden group block"
              >
                {/* Photo */}
                <div className="relative h-40 bg-linear-to-br from-white/3 to-white/1 flex items-center justify-center">
                  {photos.length > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openLightbox(photos, 0);
                      }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={photos[0]}
                        alt={item.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </button>
                  ) : (
                    <Wrench className="w-10 h-10 text-muted/30" />
                  )}
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEdit(item);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
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

                {/* Thumbnail row */}
                {photos.length > 1 && (
                  <div className="flex gap-1.5 px-5 pt-3 overflow-x-auto">
                    {photos.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openLightbox(photos, i);
                        }}
                        className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border hover:border-accent-light transition-colors"
                      >
                        <Image
                          src={url}
                          alt={`${item.name} ${i + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}

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
              </Link>
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
                  Photos
                </label>
                <div className="flex flex-wrap gap-2">
                  {existingPhotos.map((photo, i) => (
                    <div
                      key={photo.url}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group/thumb"
                    >
                      <Image
                        src={photo.url}
                        alt={`Photo ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(i)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                  {newPhotoFiles.map((file, i) => (
                    <div
                      key={file.name + i}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group/thumb"
                    >
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`New ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(i)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-accent/50 flex items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-muted" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
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

      {/* Photo Lightbox */}
      {lightboxPhotos && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxPhotos(null)}
        />
      )}
    </div>
  );
}
