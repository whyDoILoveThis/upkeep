"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";

export function JobRequired() {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <Briefcase className="w-12 h-12 text-muted/30" />
      <h3 className="text-lg font-medium">Select a Job</h3>
      <p className="text-muted text-sm text-center max-w-sm">
        Choose a job from your jobs list to view data for that property.
      </p>
      <Link
        href="/dashboard/jobs"
        className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
      >
        <Briefcase className="w-4 h-4" />
        View Jobs
      </Link>
    </div>
  );
}
