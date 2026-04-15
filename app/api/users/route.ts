import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { getDb } from "@/lib/firebase-admin";
import { profileSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const profile = {
    id: userId,
    clerkId: userId,
    role: parsed.data.role,
    name: parsed.data.name,
    email: "",
    phone: parsed.data.phone || "",
    address: parsed.data.address || "",
    company: parsed.data.company || "",
    createdAt: Date.now(),
  };

  await db.ref(`users/${userId}`).set(profile);
  return NextResponse.json(profile, { status: 201 });
}
