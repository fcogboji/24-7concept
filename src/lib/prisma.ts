import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function useNeonServerlessDriver(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.PRISMA_NEON === "false") return false;
  if (process.env.PRISMA_NEON === "true") return true;
  return url.includes("neon.tech") || url.includes("neon.aws.neon.tech");
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const log =
    process.env.NODE_ENV === "development" ? (["error", "warn"] as const) : (["error"] as const);

  if (useNeonServerlessDriver()) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter, log: [...log] });
  }

  return new PrismaClient({ log: [...log] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
