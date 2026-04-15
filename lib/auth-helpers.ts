import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { getDb } from "./firebase-admin";
import type { UserProfile, UserRole } from "./types";

/**
 * Returns userId from Clerk auth or demo cookie.
 * Demo users get a synthetic userId based on their demo role.
 */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (userId) return userId;

  // Check for demo mode
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;
  if (demoRole === "management") return "demo-management";
  if (demoRole === "homeowner") return "demo-homeowner";

  return null;
}

export async function getCurrentUser(): Promise<{
  userId: string;
  profile: UserProfile | null;
}> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const snapshot = await db.ref(`users/${userId}`).get();
  const profile = snapshot.exists() ? (snapshot.val() as UserProfile) : null;

  return { userId, profile };
}

export async function requireRole(role: UserRole): Promise<{
  userId: string;
  profile: UserProfile;
}> {
  const { userId, profile } = await getCurrentUser();

  if (!profile) {
    throw new Error("Profile not found. Please complete onboarding.");
  }

  if (profile.role !== role) {
    throw new Error("Insufficient permissions");
  }

  return { userId, profile };
}

export async function requireAuth(): Promise<{
  userId: string;
  profile: UserProfile;
}> {
  const { userId, profile } = await getCurrentUser();

  if (!profile) {
    throw new Error("Profile not found");
  }

  return { userId, profile };
}

export function getQuarterDates() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);

  return {
    quarterStart: quarterStart.toISOString().split("T")[0],
    quarterEnd: quarterEnd.toISOString().split("T")[0],
  };
}
