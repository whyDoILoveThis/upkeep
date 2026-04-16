import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { equipmentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const userRole = userSnap.exists() ? userSnap.val().role : null;

  const homeownerId = req.nextUrl.searchParams.get("homeownerId");

  let snapshot;
  if (userRole === "management" && homeownerId) {
    snapshot = await db.ref("equipment").orderByChild("userId").equalTo(homeownerId).get();
  } else if (userRole === "management") {
    snapshot = await db.ref("equipment").orderByChild("managementId").equalTo(userId).get();
  } else {
    snapshot = await db.ref("equipment").orderByChild("userId").equalTo(userId).get();
  }

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

  const body = await req.json();
  const parsed = equipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.val();
  const isManagement = user?.role === "management";

  const ref = db.ref("equipment").push();

  const equipment = {
    userId: isManagement ? (body.homeownerId || userId) : userId,
    managementId: isManagement ? userId : (body.managementId || null),
    jobId: parsed.data.jobId || null,
    ...parsed.data,
    photos: body.photos || [],
    photoUrl: null,
    photoFileId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await ref.set(equipment);
  return NextResponse.json({ id: ref.key, ...equipment }, { status: 201 });
}
