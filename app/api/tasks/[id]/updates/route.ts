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
  const task = taskSnap.val();

  // Get user info
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.val();

  // Build photos array (only url + fileId stored on the update)
  const photos = parsed.data.photos?.map((p) => ({ url: p.url, fileId: p.fileId })) || [];

  const updateRef = db.ref(`tasks/${id}/updates`).push();
  const update = {
    id: updateRef.key,
    message: parsed.data.message,
    ...(photos.length > 0 ? { photos } : {}),
    authorId: userId,
    authorName: user?.name || "Unknown",
    authorRole: user?.role || "homeowner",
    timestamp: Date.now(),
  };

  await updateRef.set(update);
  await db.ref(`tasks/${id}`).update({ updatedAt: Date.now() });

  // Register photos as file records
  if (photos.length > 0) {
    const ownerId = task.homeownerId || userId;
    for (const photo of parsed.data.photos || []) {
      const fileRef = db.ref("files").push();
      await fileRef.set({
        userId: ownerId,
        managementId: task.managementId || undefined,
        jobId: task.jobId || undefined,
        taskId: id,
        updateId: updateRef.key,
        name: photo.fileName || "Comment Photo",
        url: photo.url,
        appwriteFileId: photo.fileId,
        type: "image/jpeg",
        size: photo.fileSize || 0,
        createdAt: Date.now(),
      });
    }
  }

  return NextResponse.json(update, { status: 201 });
}
