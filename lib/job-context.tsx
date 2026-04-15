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
}

const JobContext = createContext<JobContextType>({
  selectedJob: null,
  setSelectedJob: () => {},
});

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [selectedJob, setSelectedJobState] = useState<Job | null>(null);

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

  const setSelectedJob = useCallback((job: Job | null) => {
    setSelectedJobState(job);
    if (job) {
      localStorage.setItem("selectedJob", JSON.stringify(job));
    } else {
      localStorage.removeItem("selectedJob");
    }
  }, []);

  return (
    <JobContext value={{ selectedJob, setSelectedJob }}>{children}</JobContext>
  );
}

export function useSelectedJob() {
  return useContext(JobContext);
}
