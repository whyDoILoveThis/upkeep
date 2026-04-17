"use client";

/**
 * DemoDataManager — standalone component for loading/unloading demo data.
 *
 * To remove all demo data functionality later, simply:
 *   1. Delete this file
 *   2. Remove the <DemoDataManager /> usage from the settings page
 *   3. Optionally delete app/api/demo/seed/route.ts
 */

import { useState, useEffect } from "react";
import {
  Database,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function DemoDataManager() {
  const [loaded, setLoaded] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [loadStatus, setLoadStatus] = useState<Status>("idle");
  const [unloadStatus, setUnloadStatus] = useState<Status>("idle");

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch("/api/demo/seed");
      if (res.ok) {
        const data = await res.json();
        setLoaded(data.loaded);
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }

  async function handleLoad() {
    setLoadStatus("loading");
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (res.ok) {
        setLoadStatus("success");
        setLoaded(true);
        setTimeout(() => setLoadStatus("idle"), 2000);
      } else {
        setLoadStatus("error");
        setTimeout(() => setLoadStatus("idle"), 3000);
      }
    } catch {
      setLoadStatus("error");
      setTimeout(() => setLoadStatus("idle"), 3000);
    }
  }

  async function handleUnload() {
    setUnloadStatus("loading");
    try {
      const res = await fetch("/api/demo/seed", { method: "DELETE" });
      if (res.ok) {
        setUnloadStatus("success");
        setLoaded(false);
        setTimeout(() => setUnloadStatus("idle"), 2000);
      } else {
        setUnloadStatus("error");
        setTimeout(() => setUnloadStatus("idle"), 3000);
      }
    } catch {
      setUnloadStatus("error");
      setTimeout(() => setUnloadStatus("idle"), 3000);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Database className="w-5 h-5 text-accent-light" />
        </div>
        <div>
          <h3 className="font-semibold">Demo Data</h3>
          <p className="text-xs text-muted">
            Load or remove sample data from the database
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Status:</span>
        {checking ? (
          <span className="flex items-center gap-1.5 text-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Checking...
          </span>
        ) : loaded ? (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Loaded
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted">
            <AlertCircle className="w-3.5 h-3.5" />
            Not loaded
          </span>
        )}
      </div>

      <p className="text-xs text-muted/70 leading-relaxed">
        Demo data includes sample users, jobs, equipment, tasks,
        notifications, billing records, handyman time entries, and equipment templates. Loading
        will write to the live database. Unloading removes only demo-prefixed
        records.
      </p>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleLoad}
          disabled={loadStatus === "loading" || unloadStatus === "loading"}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent/10 text-accent-light hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loadStatus === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : loadStatus === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loadStatus === "loading"
            ? "Loading..."
            : loadStatus === "success"
              ? "Loaded!"
              : "Load Demo Data"}
        </button>

        <button
          onClick={handleUnload}
          disabled={
            loadStatus === "loading" ||
            unloadStatus === "loading" ||
            loaded === false
          }
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {unloadStatus === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : unloadStatus === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {unloadStatus === "loading"
            ? "Removing..."
            : unloadStatus === "success"
              ? "Removed!"
              : "Unload Demo Data"}
        </button>
      </div>
    </div>
  );
}
