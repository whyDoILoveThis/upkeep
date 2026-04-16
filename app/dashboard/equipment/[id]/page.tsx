"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Wrench,
  Factory,
  Hash,
  MapPin,
  Shield,
  Calendar,
  StickyNote,
  ClipboardList,
  FileText,
  Pencil,
  X,
  Upload,
  Trash2,
} from "lucide-react";
import type { Equipment, EquipmentPhoto, Task, FileRecord } from "@/lib/types";
import { useSelectedJob } from "@/lib/job-context";
import { useProfile } from "../../layout";
import { JobBadge } from "@/components/job-badge";
import { PhotoLightbox } from "@/components/photo-lightbox";

function getPhotoUrls(item: Equipment): string[] {
  if (item.photos) {
    const arr = Array.isArray(item.photos)
      ? item.photos
      : (Object.values(item.photos) as EquipmentPhoto[]);
    if (arr.length > 0) return arr.map((p) => p.url);
  }
  if (item.photoUrl) return [item.photoUrl];
  return [];
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
  "Appliance",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Flooring",
  "Exterior",
  "Landscaping",
  "Security",
  "Other",
];

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const { selectedJob } = useSelectedJob();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [linkedFiles, setLinkedFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<EquipmentPhoto[]>([]);
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

  const fetchData = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}`
        : "";
      const [eqRes, tasksRes, filesRes] = await Promise.all([
        fetch(`/api/equipment/${id}`),
        fetch(`/api/tasks${params}`),
        fetch(`/api/files${params}`),
      ]);

      if (eqRes.ok) setEquipment(await eqRes.json());
      if (tasksRes.ok) {
        const tasks: Task[] = await tasksRes.json();
        setLinkedTasks(tasks.filter((t) => t.equipmentId === id));
      }
      if (filesRes.ok) {
        const files: FileRecord[] = await filesRes.json();
        setLinkedFiles(files.filter((f) => f.equipmentId === id));
      }
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [id, selectedJob]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openEdit() {
    if (!equipment) return;
    setForm({
      name: equipment.name,
      category: equipment.category,
      datePurchased: equipment.datePurchased || "",
      warrantyExpiration: equipment.warrantyExpiration || "",
      modelNo: equipment.modelNo || "",
      serialNo: equipment.serialNo || "",
      manufacturer: equipment.manufacturer || "",
      location: equipment.location || "",
      notes: equipment.notes || "",
    });
    setExistingPhotos(normalizePhotos(equipment));
    setNewPhotoFiles([]);
    setShowEditModal(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const uploadedPhotos: EquipmentPhoto[] = [];
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
        }
      }
      const photos = [...existingPhotos, ...uploadedPhotos];
      const res = await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photos }),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchData();
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this equipment?")) return;
    try {
      await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      router.push("/dashboard/equipment");
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-8 animate-pulse">
          <div className="h-6 w-48 bg-white/5 rounded mb-4" />
          <div className="h-4 w-32 bg-white/5 rounded mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="glass-card rounded-2xl p-12 text-center">
          <Wrench className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">Equipment not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {(() => {
          const photos = getPhotoUrls(equipment);
          return photos.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setLightboxPhotos(photos);
                  setLightboxIndex(0);
                }}
                className="relative w-full h-56 bg-linear-to-br from-white/3 to-white/1 block"
              >
                <Image
                  src={photos[0]}
                  alt={equipment.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
              {photos.length > 1 && (
                <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
                  {photos.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        setLightboxPhotos(photos);
                        setLightboxIndex(i);
                      }}
                      className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border hover:border-accent-light transition-colors"
                    >
                      <Image
                        src={url}
                        alt={`${equipment.name} ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null;
        })()}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted font-medium">
                {equipment.category}
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-2">
                {equipment.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <JobBadge jobId={equipment.jobId} />
              {profile?.role === "management" && (
                <>
                  <button
                    onClick={openEdit}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="Edit equipment"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors"
                    title="Delete equipment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted">
            {equipment.manufacturer && (
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 shrink-0" />{" "}
                {equipment.manufacturer}
              </div>
            )}
            {equipment.modelNo && (
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 shrink-0" /> Model: {equipment.modelNo}
              </div>
            )}
            {equipment.serialNo && (
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 shrink-0" /> Serial:{" "}
                {equipment.serialNo}
              </div>
            )}
            {equipment.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" /> {equipment.location}
              </div>
            )}
            {equipment.warrantyExpiration && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" /> Warranty:{" "}
                {new Date(equipment.warrantyExpiration).toLocaleDateString()}
              </div>
            )}
            {equipment.datePurchased && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" /> Purchased:{" "}
                {new Date(equipment.datePurchased).toLocaleDateString()}
              </div>
            )}
          </div>

          {equipment.notes && (
            <div className="flex items-start gap-2 text-sm text-muted pt-2 border-t border-border">
              <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{equipment.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Linked Tasks */}
      {linkedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Linked Tasks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {linkedTasks.map((task) => (
              <div key={task.id} className="glass-card rounded-xl p-4">
                <div className="font-medium text-sm">{task.title}</div>
                <div className="flex items-center gap-2 mt-2">
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.priority === "high"
                        ? "bg-red-400/10 text-red-400"
                        : task.priority === "medium"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-blue-400/10 text-blue-400"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Files */}
      {linkedFiles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" /> Linked Files
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {linkedFiles.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card rounded-xl p-4 hover:bg-white/5 transition-colors"
              >
                <div className="font-medium text-sm truncate">{file.name}</div>
                <div className="text-xs text-muted mt-1">
                  {file.size < 1024
                    ? file.size + " B"
                    : file.size < 1024 * 1024
                      ? (file.size / 1024).toFixed(1) + " KB"
                      : (file.size / (1024 * 1024)).toFixed(1) + " MB"}
                </div>
              </a>
            ))}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Edit Equipment</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                        onClick={() =>
                          setExistingPhotos((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
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
                        onClick={() =>
                          setNewPhotoFiles((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
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
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
