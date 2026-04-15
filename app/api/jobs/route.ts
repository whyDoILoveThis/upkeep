import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { jobSchema } from "@/lib/validations";
import type { Job } from "@/lib/types";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const userRole = userSnap.exists() ? userSnap.val().role : null;

  let snapshot;
  if (userRole === "management") {
    snapshot = await db.ref("jobs").orderByChild("managementId").equalTo(userId).get();
  } else if (userRole === "homeowner") {
    snapshot = await db.ref("jobs").orderByChild("homeownerId").equalTo(userId).get();
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!snapshot.exists()) return NextResponse.json([]);

  const items = Object.entries(snapshot.val() as Record<string, Omit<Job, "id">>).map(
    ([id, data]) => ({ id, ...data })
  );

  items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.val();

  if (user?.role !== "management") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let homeownerName: string | undefined;
  const hwSnap = await db.ref(`users/${parsed.data.homeownerId}`).get();
  if (hwSnap.exists()) homeownerName = hwSnap.val().name;

  const managementName = user.name || user.company || null;

  const ref = db.ref("jobs").push();
  const job = {
    managementId: userId,
    managementName,
    homeownerId: parsed.data.homeownerId,
    homeownerName: homeownerName || null,
    title: parsed.data.title,
    address: parsed.data.address || null,
    status: parsed.data.status || "active",
    notes: parsed.data.notes || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await ref.set(job);
  return NextResponse.json({ id: ref.key, ...job }, { status: 201 });
}
