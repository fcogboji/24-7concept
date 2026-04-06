import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/verify-email(.*)",
  "/widget.js",
  "/embed/widget-js",
  "/embed/chat(.*)",
  "/api/chat(.*)",
  "/api/bots/(.*)/suggestions",
  "/api/leads(.*)",
  "/api/health(.*)",
  "/api/session(.*)",
  "/api/embed(.*)",
  "/api/stripe/webhook(.*)",
  "/admin/sign-in(.*)",
  "/admin/unauthorized(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
