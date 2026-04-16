import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/equipment(.*)",
  "/reminders(.*)",
  "/files(.*)",
  "/tasks(.*)",
  "/billing(.*)",
  "/onboarding(.*)",
  "/api/equipment(.*)",
  "/api/reminders(.*)",
  "/api/files(.*)",
  "/api/tasks(.*)",
  "/api/billing(.*)",
  "/api/time-allotment(.*)",
  "/api/upload(.*)",
  "/api/users(.*)",
  "/api/jobs(.*)",
  "/api/equipment-templates(.*)",
  "/api/demo(.*)",
]);

const isPublicPage = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Redirect signed-in users away from public pages to dashboard
  if (userId && isPublicPage(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
