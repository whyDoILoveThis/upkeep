import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only management can update billing
  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  if (!userSnap.exists() || userSnap.val().role !== "management") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const snapshot = await db.ref(`billing/${id}`).get();

  if (!snapshot.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  await db.ref(`billing/${id}`).update(body);

  return NextResponse.json({ success: true });
}
