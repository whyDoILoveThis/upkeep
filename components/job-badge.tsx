"use client";

import { Briefcase } from "lucide-react";
import { useSelectedJob } from "@/lib/job-context";

export function JobBadge({ jobId }: { jobId?: string }) {
  const { getJobTitle } = useSelectedJob();

  if (!jobId) return null;

  const title = getJobTitle(jobId);
  if (!title) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
      <Briefcase className="w-3 h-3" />
      {title}
    </span>
  );
}
