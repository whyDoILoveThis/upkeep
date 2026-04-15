"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { DemoDataManager } from "@/components/demo-data-manager";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-accent-light" />
          Settings
        </h1>
        <p className="text-muted text-sm mt-1">
          Manage application settings and demo data.
        </p>
      </div>

      <DemoDataManager />
    </div>
  );
}
