"use client";

import { useEffect, useState } from "react";
import { useProfile } from "./layout";
import { useSelectedJob } from "@/lib/job-context";
import {
  Wrench,
  Bell,
  ClipboardList,
  Receipt,
  Timer,
  ArrowUpRight,
  Calendar,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { HandymanTimeRing } from "@/components/handyman-time-ring";

interface DashboardStats {
  equipmentCount: number;
  pendingReminders: number;
  activeTasks: number;
  pendingBills: number;
  activeJobs?: number;
  handymanTime: {
    scheduledMinutes: number;
    completedMinutes: number;
    quarterStart: string;
    quarterEnd: string;
  } | null;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: number;
  }>;
  upcomingReminders: Array<{
    id: string;
    title: string;
    dueDate: string;
    equipmentName?: string;
  }>;
}

export default function DashboardPage() {
  const { profile } = useProfile();
  const { selectedJob } = useSelectedJob();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const params = selectedJob
          ? `?homeownerId=${selectedJob.homeownerId}`
          : "";
        const res = await fetch(`/api/dashboard${params}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail
      }
    }
    fetchStats();
  }, [selectedJob]);

  const statCards = [
    ...(profile?.role === "management"
      ? [
          {
            label: "Active Jobs",
            value: stats?.activeJobs ?? "—",
            icon: Briefcase,
            href: "/dashboard/jobs",
            color: "text-purple-400",
            bg: "bg-purple-400/10",
          },
        ]
      : []),
    {
      label: "Equipment",
      value: stats?.equipmentCount ?? "—",
      icon: Wrench,
      href: "/dashboard/equipment",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Pending Reminders",
      value: stats?.pendingReminders ?? "—",
      icon: Bell,
      href: "/dashboard/reminders",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Active Tasks",
      value: stats?.activeTasks ?? "—",
      icon: ClipboardList,
      href: "/dashboard/tasks",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Pending Bills",
      value: stats?.pendingBills ?? "—",
      icon: Receipt,
      href: "/dashboard/billing",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted text-sm mt-1">
          Here&apos;s an overview of your home maintenance.
        </p>
      </div>

      {/* Stat cards */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${profile?.role === "management" ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4`}
      >
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="glass-card rounded-2xl p-5 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm text-muted mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Handyman Time */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold flex items-center gap-2">
              <Timer className="w-4 h-4 text-accent-light" />
              Handyman Time
            </h2>
            <Link
              href="/dashboard/time"
              className="text-xs text-accent-light hover:underline"
            >
              Details
            </Link>
          </div>

          {stats?.handymanTime ? (
            <HandymanTimeRing
              scheduledMinutes={stats.handymanTime.scheduledMinutes}
              completedMinutes={stats.handymanTime.completedMinutes}
              quarterStart={stats.handymanTime.quarterStart}
              quarterEnd={stats.handymanTime.quarterEnd}
            />
          ) : (
            <div className="flex items-center justify-center h-50 text-muted text-sm">
              No time data
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-accent-light" />
              Recent Tasks
            </h2>
            <Link
              href="/dashboard/tasks"
              className="text-xs text-accent-light hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {stats?.recentTasks && stats.recentTasks.length > 0 ? (
              stats.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{task.title}</div>
                    <div className="text-xs text-muted capitalize">
                      {task.priority} priority
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      task.status === "completed"
                        ? "bg-success/10 text-success"
                        : task.status === "in-progress"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-white/5 text-muted"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted text-center py-8">
                No recent tasks
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-light" />
              Upcoming Reminders
            </h2>
            <Link
              href="/dashboard/reminders"
              className="text-xs text-accent-light hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {stats?.upcomingReminders && stats.upcomingReminders.length > 0 ? (
              stats.upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{reminder.title}</div>
                    {reminder.equipmentName && (
                      <div className="text-xs text-muted">
                        {reminder.equipmentName}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-accent-light whitespace-nowrap ml-3">
                    {new Date(reminder.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted text-center py-8">
                No upcoming reminders
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
