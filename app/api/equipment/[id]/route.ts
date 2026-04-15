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

  const { id } = await params;
  const db = getDb();
  const snapshot = await db.ref(`equipment/${id}`).get();

  if (!snapshot.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = snapshot.val();
  if (existing.userId !== userId) {
    // Check if management
    const userSnap = await db.ref(`users/${userId}`).get();
    if (!userSnap.exists() || userSnap.val().role !== "management") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  await db.ref(`equipment/${id}`).update({
    ...body,
    updatedAt: Date.now(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const snapshot = await db.ref(`equipment/${id}`).get();

  if (!snapshot.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = snapshot.val();
  if (existing.userId !== userId) {
    const userSnap = await db.ref(`users/${userId}`).get();
    if (!userSnap.exists() || userSnap.val().role !== "management") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await db.ref(`equipment/${id}`).remove();
  return NextResponse.json({ success: true });
}
