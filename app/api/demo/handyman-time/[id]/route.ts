import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

function isDemoRequest(req: NextRequest): string | null {
  const role = req.cookies.get("demo_role")?.value;
  return role === "homeowner" || role === "management" ? role : null;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const demoRole = isDemoRequest(req);
  if (!demoRole) return NextResponse.json({ error: "Demo only" }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  const snap = await db.ref(`handymanTime/${id}`).get();
  if (!snap.exists()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = snap.val();
  // Only allow deleting demo entries
  if (!entry.managementId?.startsWith("demo-")) {
    return NextResponse.json({ error: "Demo accounts only" }, { status: 403 });
  }

  await db.ref(`handymanTime/${id}`).remove();
  return NextResponse.json({ success: true });
}
