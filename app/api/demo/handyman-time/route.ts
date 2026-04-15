import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

// Demo-only API for handyman time CRUD — no Clerk auth required
// Validates that the request comes from a demo session via cookie

function isDemoRequest(req: NextRequest): string | null {
  const role = req.cookies.get("demo_role")?.value;
  return role === "homeowner" || role === "management" ? role : null;
}

export async function POST(req: NextRequest) {
  const demoRole = isDemoRequest(req);
  if (!demoRole) return NextResponse.json({ error: "Demo only" }, { status: 403 });

  const body = await req.json();
  const { userId, managementId, startTime, endTime, notes } = body;

  if (!userId || !startTime || !endTime || !managementId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  // Verify the userId + managementId are demo accounts
  if (!managementId.startsWith("demo-") || !userId.startsWith("demo-")) {
    return NextResponse.json({ error: "Demo accounts only" }, { status: 403 });
  }

  const db = getDb();
  const ref = db.ref("handymanTime").push();
  const entry = {
    userId,
    managementId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    notes: notes || null,
    createdAt: Date.now(),
  };

  await ref.set(entry);
  return NextResponse.json({ id: ref.key, ...entry }, { status: 201 });
}
