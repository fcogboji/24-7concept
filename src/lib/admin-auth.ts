import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AdminContext = {
  clerkUserId: string;
  email: string | undefined;
};

export async function requireAdmin(): Promise<AdminContext> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/admin/sign-in");
  }
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    redirect("/admin/unauthorized");
  }
  return {
    clerkUserId: userId,
    email: user?.emailAddresses?.[0]?.emailAddress,
  };
}

/** For API routes: returns null if not an admin (no redirects). */
export async function requireAdminApi(): Promise<AdminContext | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  if (role !== "admin") return null;
  return {
    clerkUserId: userId,
    email: user?.emailAddresses?.[0]?.emailAddress,
  };
}

export function isAdminRole(metadata: unknown): boolean {
  return (metadata as { role?: string } | undefined)?.role === "admin";
}
