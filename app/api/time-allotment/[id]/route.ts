import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const snap = await db.ref(`handymanTime/${id}`).get();
  if (!snap.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = snap.val();
  if (entry.managementId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.startTime) updates.startTime = body.startTime;
  if (body.endTime) updates.endTime = body.endTime;
  if (body.userId) updates.userId = body.userId;
  if (body.jobId) updates.jobId = body.jobId;
  if (body.notes !== undefined) updates.notes = body.notes || null;

  if (updates.startTime && updates.endTime) {
    if (new Date(updates.endTime as string) <= new Date(updates.startTime as string)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }
  }

  await db.ref(`handymanTime/${id}`).update(updates);
  const updated = await db.ref(`handymanTime/${id}`).get();
  return NextResponse.json({ id, ...updated.val() });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const snap = await db.ref(`handymanTime/${id}`).get();
  if (!snap.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = snap.val();
  if (entry.managementId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.ref(`handymanTime/${id}`).remove();
  return NextResponse.json({ success: true });
}
