import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the signed-in Clerk user to our Prisma User (create or link by email on first sign-in).
 */
export async function getOrCreateAppUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (user) return user;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        clerkId: userId,
        ...(name ? { name } : {}),
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name,
      clerkId: userId,
      passwordHash: null,
      emailVerifiedAt: new Date(),
    },
  });
}
