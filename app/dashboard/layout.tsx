"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Wrench,
  Bell,
  FolderOpen,
  ClipboardList,
  Receipt,
  Timer,
  Home,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Eye,
  Briefcase,
  Layers,
} from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { DemoProvider, useDemoMode } from "@/lib/demo-context";
import { JobProvider, useSelectedJob } from "@/lib/job-context";
import { demoHomeowner, demoManagement } from "@/lib/demo-data";
import type { UserRole } from "@/lib/types";

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  loading: true,
});
export const useProfile = () => useContext(UserContext);

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/jobs", icon: Briefcase, label: "Jobs" },
  {
    href: "/dashboard/default-equipment",
    icon: Layers,
    label: "Default Equipment",
    managementOnly: true,
  },
  { href: "/dashboard/equipment", icon: Wrench, label: "Equipment" },
  { href: "/dashboard/reminders", icon: Bell, label: "Reminders" },
  { href: "/dashboard/files", icon: FolderOpen, label: "Files" },
  { href: "/dashboard/tasks", icon: ClipboardList, label: "Tasks" },
  { href: "/dashboard/billing", icon: Receipt, label: "Billing" },
  { href: "/dashboard/time", icon: Timer, label: "Handyman Time" },
];

function getDemoRoleFromCookie(): UserRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )demo_role=(\w+)/);
  const val = match?.[1];
  if (val === "homeowner" || val === "management") return val;
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [demoReady, setDemoReady] = useState(false);

  useEffect(() => {
    async function initDemo() {
      const role = getDemoRoleFromCookie();
      setDemoRole(role);
      if (role) {
        // Seed demo data in Firebase on first visit
        try {
          await fetch("/api/demo/seed", { method: "POST" });
        } catch {
          // ignore seed errors
        }
      }
      setDemoReady(true);
    }
    initDemo();
  }, []);

  return (
    <DemoProvider demoRole={demoRole} demoReady={demoReady}>
      <JobProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </JobProvider>
    </DemoProvider>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { demoMode, demoRole, demoReady } = useDemoMode();
  const { selectedJob, setSelectedJob } = useSelectedJob();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!demoReady) return;

    async function fetchProfile() {
      if (demoMode && demoRole) {
        // Demo mode — fetch profile from seeded DB
        try {
          const res = await fetch("/api/users/me");
          if (res.ok) {
            setProfile(await res.json());
          } else {
            // Fallback to local demo data if seed hasn't run yet
            setProfile(
              demoRole === "homeowner" ? demoHomeowner : demoManagement,
            );
          }
        } catch {
          setProfile(demoRole === "homeowner" ? demoHomeowner : demoManagement);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          router.replace("/onboarding");
          return;
        }
      } catch {
        router.replace("/onboarding");
        return;
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router, demoMode, demoRole, demoReady]);

  function exitDemo() {
    document.cookie = "demo_role=; path=/; max-age=0";
    setSelectedJob(null);
    window.location.href = "/";
  }

  return (
    <UserContext value={{ profile, loading }}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Ambient background for blur effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-150 h-150 bg-accent/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-125 h-125 bg-purple-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-indigo-500/5 rounded-full blur-[150px]" />
        </div>
        {/* Demo banner */}
        {demoMode && (
          <div className="w-full bg-accent/90 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-3 backdrop-blur-sm z-60 shrink-0">
            <Eye className="w-4 h-4" />
            Demo Mode — Viewing as{" "}
            {demoRole === "management" ? "Management Company" : "Homeowner"}
            <button
              onClick={exitDemo}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold"
            >
              <LogOut className="w-3 h-3" />
              Exit Demo
            </button>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed lg:sticky ${demoMode ? "top-10" : "top-0"} left-0 z-50 ${demoMode ? "h-[calc(100vh-2.5rem)]" : "h-screen"} lg:h-auto lg:top-0! lg:self-stretch w-64 flex flex-col transition-transform duration-300 border-r border-white/10 bg-slate-950/60 backdrop-blur-xl ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent to-purple-500 flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold tracking-tight">Upkeep</span>
              </Link>
              <button
                className="lg:hidden text-muted"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role badge */}
            {profile && (
              <div className="px-5 pt-4 pb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 text-accent-light text-xs font-medium capitalize">
                  {profile.role === "management" ? "Management" : "Homeowner"}
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems
                .filter(
                  (item) =>
                    !("managementOnly" in item && item.managementOnly) ||
                    profile?.role === "management",
                )
                .map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                        isActive
                          ? "bg-accent/10 text-accent-light font-medium"
                          : "text-muted hover:text-foreground hover:bg-glass-hover"
                      }`}
                    >
                      <item.icon
                        className={`w-4.5 h-4.5 ${isActive ? "text-accent-light" : ""}`}
                      />
                      {item.label}
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-accent-light/50" />
                      )}
                    </Link>
                  );
                })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-border">
              {demoMode ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold">
                    {profile?.name?.charAt(0) || "D"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {profile?.name || "Demo User"}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {profile?.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                      },
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {profile?.name || user?.fullName || "Loading..."}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                  <SignOutButton>
                    <button
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </SignOutButton>
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
            {/* Top bar */}
            <header className="h-16 min-h-16 flex items-center px-6 gap-4 sticky top-0 z-30 bg-background/60 backdrop-blur-md border-b border-white/5">
              <button
                className="lg:hidden text-muted hover:text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              {profile?.role === "management" && (
                <Link
                  href="/dashboard/jobs"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass text-sm group transition-colors hover:bg-white/5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-accent-light" />
                  <span className="font-medium truncate max-w-50">
                    {selectedJob ? selectedJob.title : "Select a Job"}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted group-hover:text-foreground transition-colors" />
                </Link>
              )}
              <div className="flex-1" />
              <div className="text-sm text-muted">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </UserContext>
  );
}
