import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");

  if (role === "homeowner" || role === "management") {
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.set("demo_role", role, {
      path: "/",
      maxAge: 60 * 60, // 1 hour
      httpOnly: false,
      sameSite: "lax",
    });
    return res;
  }

  // Exit demo
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete("demo_role");
  return res;
}
