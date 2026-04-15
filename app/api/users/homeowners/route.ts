import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import type { UserProfile } from "@/lib/types";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Verify requestor is management
  const userSnap = await db.ref(`users/${userId}`).get();
  if (!userSnap.exists() || userSnap.val().role !== "management") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const usersSnap = await db.ref("users").orderByChild("role").equalTo("homeowner").get();

  if (!usersSnap.exists()) {
    return NextResponse.json([]);
  }

  let homeowners = Object.values(usersSnap.val()) as UserProfile[];

  // Server-side search filtering
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (q) {
    homeowners = homeowners.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        h.email?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q) ||
        h.phone?.toLowerCase().includes(q),
    );
  }

  // Limit results for scalability
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
  homeowners = homeowners.slice(0, Math.min(limit, 100));

  return NextResponse.json(homeowners);
}
