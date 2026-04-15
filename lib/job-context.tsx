"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Job } from "./types";

interface JobContextType {
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  jobs: Job[];
  getJobTitle: (jobId?: string) => string | undefined;
}

const JobContext = createContext<JobContextType>({
  selectedJob: null,
  setSelectedJob: () => {},
  jobs: [],
  getJobTitle: () => undefined,
});

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [selectedJob, setSelectedJobState] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function loadStoredJob() {
      try {
        const stored = localStorage.getItem("selectedJob");
        if (stored) setSelectedJobState(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
    loadStoredJob();
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) setJobs(await res.json());
      } catch {
        // ignore
      }
    }
    fetchJobs();
  }, []);

  const setSelectedJob = useCallback((job: Job | null) => {
    setSelectedJobState(job);
    if (job) {
      localStorage.setItem("selectedJob", JSON.stringify(job));
    } else {
      localStorage.removeItem("selectedJob");
    }
  }, []);

  const getJobTitle = useCallback(
    (jobId?: string) => {
      if (!jobId) return undefined;
      return jobs.find((j) => j.id === jobId)?.title;
    },
    [jobs],
  );

  return (
    <JobContext value={{ selectedJob, setSelectedJob, jobs, getJobTitle }}>
      {children}
    </JobContext>
  );
}

export function useSelectedJob() {
  return useContext(JobContext);
}
