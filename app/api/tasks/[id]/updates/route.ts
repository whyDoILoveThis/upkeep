import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { taskUpdateSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  // Verify task exists
  const taskSnap = await db.ref(`tasks/${id}`).get();
  if (!taskSnap.exists()) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Get user info
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.val();

  const updateRef = db.ref(`tasks/${id}/updates`).push();
  const update = {
    id: updateRef.key,
    message: parsed.data.message,
    authorId: userId,
    authorName: user?.name || "Unknown",
    authorRole: user?.role || "homeowner",
    timestamp: Date.now(),
  };

  await updateRef.set(update);
  await db.ref(`tasks/${id}`).update({ updatedAt: Date.now() });

  return NextResponse.json(update, { status: 201 });
}
