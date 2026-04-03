import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/**
 * Resolves the signed-in Clerk user to our Prisma User (create or link by email on first sign-in).
 * Uses upsert + retry so concurrent dashboard requests cannot hit duplicate `email` creates.
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

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail?.clerkId && existingByEmail.clerkId !== userId) {
    return null;
  }

  try {
    return await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        clerkId: userId,
        passwordHash: null,
        emailVerifiedAt: new Date(),
      },
      update: {
        clerkId: userId,
        ...(name ? { name } : {}),
        ...(existingByEmail && !existingByEmail.emailVerifiedAt
          ? { emailVerifiedAt: new Date() }
          : {}),
      },
    });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    const byClerk = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (byClerk) return byClerk;
    const again = await prisma.user.findUnique({ where: { email } });
    if (again) {
      return prisma.user.update({
        where: { id: again.id },
        data: {
          clerkId: userId,
          ...(name ? { name } : {}),
          emailVerifiedAt: again.emailVerifiedAt ?? new Date(),
        },
      });
    }
    throw e;
  }
}
