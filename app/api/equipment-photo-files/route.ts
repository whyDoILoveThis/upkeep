import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";

/**
 * Register equipment photos as file records so they appear in the Files page.
 * Body: { equipmentId, equipmentName, jobId?, photos: { url, fileId, fileName, fileSize }[] }
 */
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { equipmentId, equipmentName, jobId, photos } = body as {
    equipmentId: string;
    equipmentName: string;
    jobId?: string;
    photos: { url: string; fileId: string; fileName: string; fileSize: number }[];
  };

  if (!equipmentId || !photos?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.val();
  const isManagement = user?.role === "management";

  // Look up the equipment to get the homeowner userId
  const eqSnap = await db.ref(`equipment/${equipmentId}`).get();
  const eq = eqSnap.exists() ? eqSnap.val() : null;
  const ownerId = eq?.userId || userId;

  const created: string[] = [];

  for (const photo of photos) {
    const ref = db.ref("files").push();
    await ref.set({
      userId: ownerId,
      managementId: isManagement ? userId : (eq?.managementId || null),
      jobId: jobId || eq?.jobId || null,
      equipmentId,
      equipmentName: equipmentName || null,
      name: photo.fileName,
      url: photo.url,
      appwriteFileId: photo.fileId,
      type: "image/jpeg",
      size: photo.fileSize,
      createdAt: Date.now(),
    });
    created.push(ref.key!);
  }

  return NextResponse.json({ created }, { status: 201 });
}
