import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicAdminRoute = createRouteMatcher([
  "/admin/sign-in(.*)",
  "/admin/unauthorized(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicAdminRoute(req)) {
    return;
  }
  await auth.protect();
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
