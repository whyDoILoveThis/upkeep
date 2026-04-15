"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Home, ArrowRight, Building2, LogOut } from "lucide-react";

export default function OnboardingPage() {
  useUser();
  const router = useRouter();
  const [role, setRole] = useState<"homeowner" | "management" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, phone, address, company }),
      });

      if (!res.ok) throw new Error("Failed to create profile");
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      {/* Sign out button */}
      <div className="fixed top-4 right-4 z-50">
        <SignOutButton>
          <button className="glass rounded-xl px-4 py-2 text-sm text-muted hover:text-foreground flex items-center gap-2 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </SignOutButton>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-125 h-125 bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome to Upkeep
          </h1>
          <p className="text-muted">Let&apos;s set up your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-8 space-y-6"
        >
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("homeowner")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === "homeowner"
                    ? "border-accent bg-accent/10 text-accent-light"
                    : "border-border hover:border-white/20 bg-glass"
                }`}
              >
                <Home className="w-5 h-5 mb-2" />
                <div className="font-medium text-sm">Homeowner</div>
                <div className="text-xs text-muted mt-0.5">
                  Manage my property
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("management")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === "management"
                    ? "border-accent bg-accent/10 text-accent-light"
                    : "border-border hover:border-white/20 bg-glass"
                }`}
              >
                <Building2 className="w-5 h-5 mb-2" />
                <div className="font-medium text-sm">Management Co.</div>
                <div className="text-xs text-muted mt-0.5">
                  Manage properties
                </div>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          {/* Address (homeowner) or Company (management) */}
          {role === "homeowner" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Property Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          )}

          {role === "management" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Property Management"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!role || !name || loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Continue"}{" "}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
