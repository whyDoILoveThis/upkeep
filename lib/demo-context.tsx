"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "./types";

interface DemoContextType {
  demoMode: boolean;
  demoRole: UserRole | null;
  demoReady: boolean;
}

const DemoContext = createContext<DemoContextType>({
  demoMode: false,
  demoRole: null,
  demoReady: false,
});

export function DemoProvider({
  demoRole,
  demoReady,
  children,
}: {
  demoRole: UserRole | null;
  demoReady: boolean;
  children: React.ReactNode;
}) {
  return (
    <DemoContext value={{ demoMode: !!demoRole, demoRole, demoReady }}>
      {children}
    </DemoContext>
  );
}

export function useDemoMode() {
  return useContext(DemoContext);
}
