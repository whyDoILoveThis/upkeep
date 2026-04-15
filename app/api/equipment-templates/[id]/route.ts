import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { equipmentTemplateSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const snap = await db.ref(`equipmentTemplates/${id}`).get();
  if (!snap.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (snap.val().managementId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = equipmentTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.ref(`equipmentTemplates/${id}`).update({ ...parsed.data, updatedAt: Date.now() });
  return NextResponse.json({ id, ...snap.val(), ...parsed.data, updatedAt: Date.now() });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const snap = await db.ref(`equipmentTemplates/${id}`).get();
  if (!snap.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (snap.val().managementId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.ref(`equipmentTemplates/${id}`).remove();
  return NextResponse.json({ success: true });
}
