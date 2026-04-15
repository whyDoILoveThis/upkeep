"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FolderOpen,
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Trash2,
  Download,
  Link as LinkIcon,
  X,
} from "lucide-react";
import type { FileRecord, Equipment } from "@/lib/types";
import { useSelectedJob } from "@/lib/job-context";
import { useProfile } from "../layout";
import { JobBadge } from "@/components/job-badge";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf")) return FileText;
  return File;
}

export default function FilesPage() {
  const { profile } = useProfile();
  const { selectedJob } = useSelectedJob();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [filterEquipmentId, setFilterEquipmentId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = selectedJob
        ? `?homeownerId=${selectedJob.homeownerId}`
        : "";
      const [filesRes, eqRes] = await Promise.all([
        fetch(`/api/files${params}`),
        fetch(`/api/equipment${params}`),
      ]);
      if (filesRes.ok) setFiles(await filesRes.json());
      if (eqRes.ok) setEquipment(await eqRes.json());
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (selectedEquipmentId)
        formData.append("equipmentId", selectedEquipmentId);

      const res = await fetch("/api/files", { method: "POST", body: formData });
      if (res.ok) {
        setShowModal(false);
        setSelectedFile(null);
        setSelectedEquipmentId("");
        fetchData();
      }
    } catch {
      //  handle
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file?")) return;
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle
    }
  }

  const jobScoped =
    profile?.role === "management" && selectedJob
      ? files.filter((f) => f.userId === selectedJob.homeownerId)
      : files;

  const filtered = filterEquipmentId
    ? jobScoped.filter((f) => f.equipmentId === filterEquipmentId)
    : jobScoped;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Storage</h1>
          <p className="text-muted text-sm mt-1">
            Store and organize documents linked to your equipment.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Upload className="w-4 h-4" /> Upload File
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Filter by equipment:</span>
        <select
          value={filterEquipmentId}
          onChange={(e) => setFilterEquipmentId(e.target.value)}
          className="glass-input rounded-xl px-4 py-2 text-sm"
        >
          <option value="" className="bg-[#0f172a]">
            All Files
          </option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id} className="bg-[#0f172a]">
              {eq.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-white/5 mb-3" />
              <div className="h-4 w-32 bg-white/5 rounded mb-1" />
              <div className="h-3 w-20 bg-white/3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No files yet</h3>
          <p className="text-sm text-muted">
            Upload your first document or receipt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div key={file.id} className="glass-card rounded-xl p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-accent-light" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/10"
                    >
                      <Download className="w-3.5 h-3.5 text-muted" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted mt-1">
                  {formatFileSize(file.size)}
                </div>
                {file.equipmentName && (
                  <div className="flex items-center gap-1 text-xs text-accent-light mt-2">
                    <LinkIcon className="w-3 h-3" />
                    {file.equipmentName}
                  </div>
                )}
                <div className="mt-2">
                  <JobBadge jobId={file.jobId} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative glass-strong rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Upload File</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">File</label>
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors">
                  {selectedFile ? (
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-accent-light mx-auto mb-2" />
                      <div className="text-sm">{selectedFile.name}</div>
                      <div className="text-xs text-muted">
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                      <div className="text-sm text-muted">
                        Click to select a file
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Link to Equipment
                </label>
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
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
                  disabled={!selectedFile || uploading}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
