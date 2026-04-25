import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AdminContext = {
  clerkUserId: string;
  email: string | undefined;
};

/** True if Clerk metadata grants admin (supports `role` string or `roles` array). */
function metadataGrantsAdmin(meta: Record<string, unknown> | null | undefined): boolean {
  if (!meta || typeof meta !== "object") return false;
  const role = meta.role;
  if (typeof role === "string" && role.trim().toLowerCase() === "admin") return true;
  if (Array.isArray(meta.roles)) {
    return meta.roles.some((x) => typeof x === "string" && x.trim().toLowerCase() === "admin");
  }
  return false;
}

function envAllowlistsUser(userId: string): boolean {
  const raw = process.env.ADMIN_CLERK_USER_IDS?.trim();
  if (!raw) return false;
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.includes(userId);
}

/**
 * Resolves admin access from Clerk session claims, user metadata, and a fresh Backend API read.
 * Supports public, private, and unsafe metadata; JWT `public_metadata` / `metadata` claims;
 * and optional `ADMIN_CLERK_USER_IDS`.
 */
async function resolveAdminContext(): Promise<AdminContext | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  if (envAllowlistsUser(userId)) {
    const user = await currentUser();
    return {
      clerkUserId: userId,
      email: user?.emailAddresses?.[0]?.emailAddress,
    };
  }

  const claims = sessionClaims as Record<string, unknown> | null | undefined;
  if (claims) {
    if (
      metadataGrantsAdmin(claims.public_metadata as Record<string, unknown>) ||
      metadataGrantsAdmin(claims.metadata as Record<string, unknown>)
    ) {
      const user = await currentUser();
      return {
        clerkUserId: userId,
        email: user?.emailAddresses?.[0]?.emailAddress,
      };
    }
  }

  const user = await currentUser();
  if (user) {
    if (
      metadataGrantsAdmin(user.publicMetadata as Record<string, unknown>) ||
      metadataGrantsAdmin(user.privateMetadata as Record<string, unknown>)
    ) {
      return {
        clerkUserId: userId,
        email: user.emailAddresses?.[0]?.emailAddress,
      };
    }
  }

  try {
    const client = await clerkClient();
    const fresh = await client.users.getUser(userId);
    if (
      metadataGrantsAdmin(fresh.publicMetadata as Record<string, unknown>) ||
      metadataGrantsAdmin(fresh.privateMetadata as Record<string, unknown>)
    ) {
      return {
        clerkUserId: userId,
        email: fresh.emailAddresses?.[0]?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress,
      };
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Use when you only need a boolean (e.g. conditional UI). */
export async function isClerkAdmin(): Promise<boolean> {
  return (await resolveAdminContext()) !== null;
}

export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await resolveAdminContext();
  if (!ctx) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/admin/sign-in");
    }
    redirect("/admin/unauthorized");
  }
  return ctx;
}

/** For API routes: returns null if not an admin (no redirects). */
export async function requireAdminApi(): Promise<AdminContext | null> {
  return resolveAdminContext();
}

export function isAdminRole(metadata: unknown): boolean {
  return metadataGrantsAdmin(metadata as Record<string, unknown> | null | undefined);
}
