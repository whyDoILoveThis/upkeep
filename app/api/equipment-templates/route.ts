import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { equipmentTemplateSchema } from "@/lib/validations";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  if (!userSnap.exists() || userSnap.val().role !== "management") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await db.ref("equipmentTemplates").orderByChild("managementId").equalTo(userId).get();
  if (!snapshot.exists()) return NextResponse.json([]);

  const items = Object.entries(snapshot.val()).map(([id, data]) => ({
    id,
    ...(data as Record<string, unknown>),
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  if (!userSnap.exists() || userSnap.val().role !== "management") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = equipmentTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ref = db.ref("equipmentTemplates").push();
  const template = {
    managementId: userId,
    ...parsed.data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await ref.set(template);
  return NextResponse.json({ id: ref.key, ...template }, { status: 201 });
}
