import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { deleteFile } from "@/lib/appwrite-server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteParams,
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const snapshot = await db.ref(`files/${id}`).get();

  if (!snapshot.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = snapshot.val();
  if (file.userId !== userId && file.managementId !== userId) {
    const userSnap = await db.ref(`users/${userId}`).get();
    if (!userSnap.exists() || userSnap.val().role !== "management") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ id, ...file });
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams,
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const snapshot = await db.ref(`files/${id}`).get();

  if (!snapshot.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = snapshot.val();
  if (existing.userId !== userId && existing.managementId !== userId) {
    const userSnap = await db.ref(`users/${userId}`).get();
    if (!userSnap.exists() || userSnap.val().role !== "management") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await db.ref(`files/${id}`).update(updates);
  return NextResponse.json({ id, ...existing, ...updates });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const snapshot = await db.ref(`files/${id}`).get();

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

  // Delete from Appwrite storage
  if (existing.appwriteFileId) {
    try {
      await deleteFile(existing.appwriteFileId);
    } catch {
      // File may already be deleted
    }
  }

  await db.ref(`files/${id}`).remove();
  return NextResponse.json({ success: true });
}
