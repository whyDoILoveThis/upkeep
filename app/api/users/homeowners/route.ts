import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";

export async function GET() {
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

  const homeowners = Object.values(usersSnap.val());
  return NextResponse.json(homeowners);
}
