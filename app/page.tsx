"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs/legacy";
import { motion } from "framer-motion";
import {
  Shield,
  Wrench,
  Clock,
  FileText,
  BarChart3,
  Bell,
  ChevronRight,
  Sparkles,
  Home,
  Users,
  ArrowRight,
  Check,
  Play,
  Loader2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

const features = [
  {
    icon: Wrench,
    title: "Equipment Inventory",
    description:
      "Track every appliance, system, and fixture with photos, warranties, model numbers, and maintenance history.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Never miss a maintenance window. Recurring schedules linked directly to your inventoried equipment.",
  },
  {
    icon: FileText,
    title: "Document Storage",
    description:
      "Manuals, receipts, warranties — all organized and linked to the equipment they belong to.",
  },
  {
    icon: Clock,
    title: "Task Management",
    description:
      "Create, assign, and track maintenance tasks with real-time status updates from your team.",
  },
  {
    icon: BarChart3,
    title: "Billing & Payments",
    description:
      "Transparent billing records, payment tracking, and invoice management in one view.",
  },
  {
    icon: Shield,
    title: "Handyman Time Tracking",
    description:
      "Visual dashboard showing quarterly handyman time usage — so you always know what's available.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "Real-time", label: "Data Sync" },
  { value: "256-bit", label: "Encryption" },
  { value: "24/7", label: "Monitoring" },
];

export default function LandingPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [demoLoading, setDemoLoading] = useState<
    "homeowner" | "management" | null
  >(null);

  async function handleDemoSignIn(role: "homeowner" | "management") {
    if (!isLoaded || !signIn || !setActive) return;
    setDemoLoading(role);
    try {
      const email =
        role === "homeowner"
          ? process.env.NEXT_PUBLIC_DEMO_HOMEOWNER_EMAIL!
          : process.env.NEXT_PUBLIC_DEMO_MANAGEMENT_EMAIL!;
      const password =
        role === "homeowner"
          ? process.env.NEXT_PUBLIC_DEMO_HOMEOWNER_PASSWORD!
          : process.env.NEXT_PUBLIC_DEMO_MANAGEMENT_PASSWORD!;

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/dashboard";
      } else {
        console.error("Demo sign-in incomplete, status:", result.status);
        setDemoLoading(null);
      }
    } catch (err) {
      console.error("Demo sign-in failed:", err);
      setDemoLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-150 h-150 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-125 h-125 bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-indigo-500/3 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent to-purple-500 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Upkeep</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#roles"
              className="hover:text-foreground transition-colors"
            >
              For Teams
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-muted hover:text-foreground transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              Get Started <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-sm text-muted"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-light" />
            Premium home maintenance management
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Your home, managed
            <br />
            <span className="gradient-text">with precision.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The all-in-one platform for homeowners and management companies to
            track equipment, schedule maintenance, manage tasks, and keep
            everything running perfectly.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/sign-up"
              className="btn-primary text-base px-8 py-3 flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-3">
              See Features
            </a>
          </motion.div>

          {/* Demo Buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <p className="text-sm text-muted">Or explore with a live demo</p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleDemoSignIn("homeowner")}
                disabled={!!demoLoading}
                className="group glass-card rounded-xl px-6 py-3 flex items-center gap-3 hover:bg-accent/10 transition-all duration-300 disabled:opacity-60"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
                  <Home className="w-4 h-4 text-accent-light" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Homeowner Demo</div>
                  <div className="text-xs text-muted">View as a homeowner</div>
                </div>
                {demoLoading === "homeowner" ? (
                  <Loader2 className="w-3.5 h-3.5 text-accent-light ml-2 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-accent-light ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              <button
                onClick={() => handleDemoSignIn("management")}
                disabled={!!demoLoading}
                className="group glass-card rounded-xl px-6 py-3 flex items-center gap-3 hover:bg-purple-500/10 transition-all duration-300 disabled:opacity-60"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Management Demo</div>
                  <div className="text-xs text-muted">View as management</div>
                </div>
                {demoLoading === "management" ? (
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 ml-2 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-purple-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={5}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-5">
                <div className="text-2xl font-bold text-accent-light">
                  {stat.value}
                </div>
                <div className="text-sm text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative z-10 px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-card rounded-3xl p-1.5 glow-accent"
          >
            <div className="rounded-2xl bg-surface overflow-hidden">
              {/* Fake Dashboard UI */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="glass rounded-lg px-4 py-1 text-xs text-muted">
                    app.upkeephome.com/dashboard
                  </div>
                </div>
              </div>
              <div className="p-8 grid grid-cols-12 gap-6 min-h-100">
                {/* Sidebar mockup */}
                <div className="col-span-3 space-y-3 hidden md:block">
                  {[
                    "Dashboard",
                    "Equipment",
                    "Reminders",
                    "Tasks",
                    "Billing",
                    "Files",
                  ].map((item, i) => (
                    <div
                      key={item}
                      className={`px-4 py-2.5 rounded-xl text-sm ${
                        i === 0
                          ? "bg-accent/10 text-accent-light font-medium"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {/* Content mockup */}
                <div className="col-span-12 md:col-span-9 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-6 w-40 rounded bg-white/5" />
                      <div className="h-4 w-64 rounded bg-white/3 mt-2" />
                    </div>
                    <div className="h-9 w-28 rounded-xl bg-accent/20" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Active Tasks", val: "12" },
                      { label: "Equipment", val: "34" },
                      { label: "Time Left", val: "6.5h" },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="glass-card rounded-2xl p-5"
                      >
                        <div className="text-sm text-muted">{card.label}</div>
                        <div className="text-3xl font-bold mt-1">
                          {card.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card rounded-2xl p-5 space-y-3">
                    <div className="text-sm font-medium text-muted">
                      Recent Activity
                    </div>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/10" />
                        <div className="flex-1">
                          <div className="h-3.5 w-48 rounded bg-white/5" />
                          <div className="h-3 w-32 rounded bg-white/3 mt-1" />
                        </div>
                        <div className="h-6 w-16 rounded-full bg-success/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4 text-sm text-muted">
              <Sparkles className="w-3.5 h-3.5 text-accent-light" />
              Everything you need
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Powerful features,
              <br />
              <span className="gradient-text">beautifully simple.</span>
            </h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Every tool you need to manage residential maintenance, from
              inventory to invoicing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card rounded-2xl p-8 group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent-light" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 py-32">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Up and running
              <br />
              <span className="gradient-text">in minutes.</span>
            </h2>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up as a homeowner or management company. Setup takes less than 2 minutes.",
              },
              {
                step: "02",
                title: "Add your equipment",
                desc: "Catalog appliances, systems, and fixtures with photos, warranties, and details.",
              },
              {
                step: "03",
                title: "Set schedules & tasks",
                desc: "Create reminders, assign tasks to your team, and track progress in real-time.",
              },
              {
                step: "04",
                title: "Stay in control",
                desc: "Monitor everything from a single dashboard — billing, timelines, and maintenance history.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card rounded-2xl p-8 flex items-start gap-6"
              >
                <div className="text-3xl font-bold text-accent/30 font-mono">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles section */}
      <section id="roles" className="relative z-10 px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Built for <span className="gradient-text">both sides.</span>
            </h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Whether you own the home or manage the maintenance, Upkeep is
              designed for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Home,
                role: "Homeowner",
                items: [
                  "View and manage all equipment",
                  "Track maintenance schedules",
                  "Upload documents and warranties",
                  "See quarterly handyman time",
                  "Review billing and invoices",
                  "Request and monitor tasks",
                ],
              },
              {
                icon: Users,
                role: "Management Company",
                items: [
                  "Manage multiple properties",
                  "Assign and track staff tasks",
                  "Post real-time project updates",
                  "Generate and track billing",
                  "Manage handyman time",
                  "Access all equipment records",
                ],
              },
            ].map((card, i) => (
              <motion.div
                key={card.role}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card rounded-2xl p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <card.icon className="w-6 h-6 text-accent-light" />
                </div>
                <h3 className="text-2xl font-bold mb-6">{card.role}</h3>
                <ul className="space-y-3">
                  {card.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-muted"
                    >
                      <Check className="w-4 h-4 text-success shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    handleDemoSignIn(
                      card.role === "Homeowner" ? "homeowner" : "management",
                    )
                  }
                  disabled={!!demoLoading}
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 glass rounded-xl px-6 py-3 text-sm font-medium hover:bg-accent/10 transition-all duration-300 disabled:opacity-60"
                >
                  {demoLoading ===
                  (card.role === "Homeowner" ? "homeowner" : "management") ? (
                    <Loader2 className="w-3.5 h-3.5 text-accent-light animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-accent-light" />
                  )}
                  Try {card.role} Demo
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="glass-card rounded-3xl p-12 sm:p-16 glow-accent"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Ready to simplify
              <br />
              <span className="gradient-text">home maintenance?</span>
            </h2>
            <p className="text-lg text-muted mb-8 max-w-lg mx-auto">
              Join the platform trusted by homeowners and maintenance
              professionals. Get started in minutes.
            </p>
            <Link
              href="/sign-up"
              className="btn-primary text-base px-10 py-3.5 inline-flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-accent to-purple-500 flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">Upkeep</span>
          </div>
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} Upkeep. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
