import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const VERIFY_EXPIRY_MS = 48 * 60 * 60 * 1000;
export const RESET_EXPIRY_MS = 60 * 60 * 1000;

export type AuthTokenType = "email_verify" | "password_reset";

export function hashAuthToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function createAuthToken(userId: string, type: AuthTokenType): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashAuthToken(raw);
  const expiresAt = new Date(
    Date.now() + (type === "email_verify" ? VERIFY_EXPIRY_MS : RESET_EXPIRY_MS)
  );

  await prisma.authToken.deleteMany({ where: { userId, type } });
  await prisma.authToken.create({
    data: { userId, tokenHash, type, expiresAt },
  });

  return raw;
}

export async function consumeAuthToken(raw: string, type: AuthTokenType) {
  const tokenHash = hashAuthToken(raw);
  const row = await prisma.authToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!row || row.type !== type) {
    return null;
  }

  if (row.expiresAt < new Date()) {
    await prisma.authToken.delete({ where: { id: row.id } });
    return null;
  }

  return row;
}
