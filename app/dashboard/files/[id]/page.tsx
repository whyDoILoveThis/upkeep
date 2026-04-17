"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
  Wrench,
  Calendar,
  MessageSquare,
} from "lucide-react";
import type { FileRecord } from "@/lib/types";
import { JobBadge } from "@/components/job-badge";
import { PhotoLightbox } from "@/components/photo-lightbox";

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

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const fetchFile = useCallback(async () => {
    try {
      const res = await fetch(`/api/files/${id}`);
      if (res.ok) setFile(await res.json());
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  function startEditing() {
    if (!file) return;
    setEditName(file.name);
    setEditing(true);
  }

  async function saveName() {
    if (!file || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFile(updated);
        setEditing(false);
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this file?")) return;
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      router.push("/dashboard/files");
    } catch {
      // handle
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-16 bg-white/5 rounded animate-pulse" />
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="h-48 bg-white/5 rounded-xl mb-4" />
          <div className="h-5 w-48 bg-white/5 rounded mb-2" />
          <div className="h-4 w-32 bg-white/3 rounded" />
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold mb-1">File not found</h3>
        </div>
      </div>
    );
  }

  const isImage = file.type.startsWith("image/");
  const FileIcon = getFileIcon(file.type);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Image preview */}
        {isImage && (
          <button
            type="button"
            onClick={() => setShowLightbox(true)}
            className="relative w-full h-72 sm:h-96 bg-white/3 block cursor-zoom-in"
          >
            <Image
              src={file.url}
              alt={file.name}
              fill
              className="object-contain"
              unoptimized
            />
          </button>
        )}

        {/* Non-image icon */}
        {!isImage && (
          <div className="flex items-center justify-center h-48 bg-white/3">
            <FileIcon className="w-16 h-16 text-muted/40" />
          </div>
        )}

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Name (editable) */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input rounded-xl px-3 py-2 text-lg font-bold tracking-tight w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditing(false);
                    }}
                  />
                  <button
                    onClick={saveName}
                    disabled={saving}
                    className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent-light transition-colors shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1
                  className="text-2xl font-bold tracking-tight break-all cursor-pointer group"
                  onClick={startEditing}
                  title="Click to rename"
                >
                  {file.name}
                  <Pencil className="w-4 h-4 text-muted inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <JobBadge jobId={file.jobId} />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted">
            <div className="flex items-center gap-2">
              <FileIcon className="w-4 h-4 shrink-0" />
              {file.type} &middot; {formatFileSize(file.size)}
            </div>
            {file.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                {new Date(file.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Equipment link */}
          {file.equipmentName && file.equipmentId && (
            <Link
              href={`/dashboard/equipment/${file.equipmentId}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/20 text-accent-light hover:bg-accent/30 border border-accent/20 hover:border-accent/40 transition-all font-semibold text-base w-fit"
            >
              <Wrench className="w-4.5 h-4.5" />
              {file.equipmentName}
              <span className="text-xs opacity-60 ml-1">→</span>
            </Link>
          )}

          {/* Task comment link */}
          {file.taskId && (
            <Link
              href="/dashboard/tasks"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 border border-purple-400/20 hover:border-purple-400/40 transition-all font-semibold text-base w-fit"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              From task comment
              <span className="text-xs opacity-60 ml-1">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <PhotoLightbox
          photos={[file.url]}
          initialIndex={0}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
