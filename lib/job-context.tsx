"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useUser } from "@clerk/nextjs";
import { ref, onValue } from "firebase/database";
import { getClientDb } from "./firebase-client";
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
  const { user } = useUser();
  const [selectedJob, setSelectedJobState] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

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

  // Fetch user role once
  useEffect(() => {
    if (!user?.id) return;
    const db = getClientDb();
    const userRef = ref(db, `users/${user.id}`);
    const unsub = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserRole(snapshot.val().role);
      }
    });
    return unsub;
  }, [user?.id]);

  // Real-time jobs listener
  useEffect(() => {
    if (!user?.id || !userRole) return;

    const db = getClientDb();
    const jobsRef = ref(db, "jobs");
    const unsub = onValue(jobsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setJobs([]);
        return;
      }
      const all = snapshot.val() as Record<string, Omit<Job, "id">>;
      const items = Object.entries(all)
        .map(([id, data]) => ({ id, ...data }))
        .filter((j) =>
          userRole === "management"
            ? j.managementId === user.id
            : j.homeownerId === user.id,
        )
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setJobs(items);
    });
    return unsub;
  }, [user?.id, userRole]);

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
