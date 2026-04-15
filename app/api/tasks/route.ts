import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { taskSchema } from "@/lib/validations";
import type { Task } from "@/lib/types";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const userRole = userSnap.exists() ? userSnap.val().role : null;

  const homeownerId = req.nextUrl.searchParams.get("homeownerId");

  let snapshot;
  if (userRole === "management" && homeownerId) {
    snapshot = await db.ref("tasks").orderByChild("homeownerId").equalTo(homeownerId).get();
  } else if (userRole === "management") {
    snapshot = await db.ref("tasks").orderByChild("managementId").equalTo(userId).get();
  } else {
    snapshot = await db.ref("tasks").orderByChild("homeownerId").equalTo(userId).get();
  }

  if (!snapshot.exists()) return NextResponse.json([]);

  const items = Object.entries(snapshot.val() as Record<string, Omit<Task, "id">>).map(([id, data]) => ({
    id,
    ...data,
  }));

  // Sort by updatedAt desc
  items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.val();

  // Determine homeowner
  let homeownerId = userId;
  let homeownerName = user?.name;

  if (user?.role === "management" && parsed.data.homeownerId) {
    homeownerId = parsed.data.homeownerId;
    const hwSnap = await db.ref(`users/${parsed.data.homeownerId}`).get();
    if (hwSnap.exists()) homeownerName = hwSnap.val().name;
  }

  // Resolve equipment name
  let equipmentName: string | undefined;
  if (parsed.data.equipmentId) {
    const eqSnap = await db.ref(`equipment/${parsed.data.equipmentId}`).get();
    if (eqSnap.exists()) equipmentName = eqSnap.val().name;
  }

  const ref = db.ref("tasks").push();
  const task = {
    homeownerId,
    homeownerName,
    managementId: user?.role === "management" ? userId : null,
    jobId: parsed.data.jobId || null,
    assignedTo: user?.role === "management" ? userId : null,
    assignedToName: user?.role === "management" ? user.name : null,
    title: parsed.data.title,
    description: parsed.data.description || "",
    status: "pending",
    priority: parsed.data.priority,
    equipmentId: parsed.data.equipmentId || null,
    equipmentName: equipmentName || null,
    updates: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await ref.set(task);
  return NextResponse.json({ id: ref.key, ...task }, { status: 201 });
}
