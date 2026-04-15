import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { uploadFile } from "@/lib/appwrite-server";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const userRole = userSnap.exists() ? userSnap.val().role : null;

  const homeownerId = req.nextUrl.searchParams.get("homeownerId");

  let snapshot;
  if (userRole === "management" && homeownerId) {
    snapshot = await db.ref("files").orderByChild("userId").equalTo(homeownerId).get();
  } else if (userRole === "management") {
    snapshot = await db.ref("files").orderByChild("managementId").equalTo(userId).get();
  } else {
    snapshot = await db.ref("files").orderByChild("userId").equalTo(userId).get();
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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const equipmentId = formData.get("equipmentId") as string | null;
  const jobId = formData.get("jobId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { fileId: appwriteFileId, fileUrl } = await uploadFile(buffer, file.name);

  const db = getDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  const user = userSnap.val();
  const isManagement = user?.role === "management";

  // Resolve equipment name
  let equipmentName: string | undefined;
  if (equipmentId) {
    const eqSnap = await db.ref(`equipment/${equipmentId}`).get();
    if (eqSnap.exists()) equipmentName = eqSnap.val().name;
  }

  const ref = db.ref("files").push();
  const fileRecord = {
    userId: isManagement ? (formData.get("homeownerId") as string || userId) : userId,
    managementId: isManagement ? userId : null,
    jobId: jobId || null,
    equipmentId: equipmentId || null,
    equipmentName: equipmentName || null,
    name: file.name,
    url: fileUrl,
    appwriteFileId,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
  };

  await ref.set(fileRecord);
  return NextResponse.json({ id: ref.key, ...fileRecord }, { status: 201 });
}
