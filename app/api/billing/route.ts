import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { billingSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const userRole = userSnap.exists() ? userSnap.val().role : null;

  const homeownerId = req.nextUrl.searchParams.get("homeownerId");

  let snapshot;
  if (userRole === "management" && homeownerId) {
    snapshot = await db.ref("billing").orderByChild("homeownerId").equalTo(homeownerId).get();
  } else if (userRole === "management") {
    snapshot = await db.ref("billing").get();
  } else {
    snapshot = await db.ref("billing").orderByChild("homeownerId").equalTo(userId).get();
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

  // Only management can create billing
  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  if (!userSnap.exists() || userSnap.val().role !== "management") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = billingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Resolve homeowner name
  let homeownerName: string | undefined;
  const hwSnap = await db.ref(`users/${parsed.data.homeownerId}`).get();
  if (hwSnap.exists()) homeownerName = hwSnap.val().name;

  const ref = db.ref("billing").push();
  const billing = {
    ...parsed.data,
    homeownerName,
    status: "pending",
    paidDate: null,
    createdAt: Date.now(),
  };

  await ref.set(billing);
  return NextResponse.json({ id: ref.key, ...billing }, { status: 201 });
}
