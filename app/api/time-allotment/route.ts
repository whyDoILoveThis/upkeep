import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import type { HandymanTime } from "@/lib/types";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const userRole = userSnap.exists() ? userSnap.val().role : null;

  const homeownerId = req.nextUrl.searchParams.get("homeownerId");

  let snapshot;
  if (userRole === "management") {
    if (homeownerId) {
      snapshot = await db.ref("handymanTime").orderByChild("userId").equalTo(homeownerId).get();
    } else {
      snapshot = await db.ref("handymanTime").orderByChild("managementId").equalTo(userId).get();
    }
  } else if (userRole === "homeowner") {
    snapshot = await db.ref("handymanTime").orderByChild("userId").equalTo(userId).get();
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!snapshot.exists()) return NextResponse.json([]);

  const items = Object.entries(snapshot.val() as Record<string, Omit<HandymanTime, "id">>).map(
    ([id, data]) => ({ id, ...data })
  );

  items.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
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
  const { userId: targetUserId, startTime, endTime, notes } = body;

  if (!targetUserId || !startTime || !endTime) {
    return NextResponse.json({ error: "userId, startTime, and endTime are required" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  const ref = db.ref("handymanTime").push();
  const entry: Omit<HandymanTime, "id"> = {
    userId: targetUserId,
    managementId: userId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    notes: notes || null,
    createdAt: Date.now(),
  };

  await ref.set(entry);
  return NextResponse.json({ id: ref.key, ...entry }, { status: 201 });
}
