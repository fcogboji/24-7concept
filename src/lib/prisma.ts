import "./ensure-ws-no-bufferutil";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function shouldUseNeonServerlessDriver(): boolean {
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

  if (shouldUseNeonServerlessDriver()) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter, log: [...log] });
  }

  return new PrismaClient({ log: [...log] });
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) return existing;

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/**
 * Lazy proxy rather than a client built at import time. `next build` imports
 * every route module to collect page data, so constructing the client here
 * would make the build itself require DATABASE_URL — which is why Preview
 * deployments (prod-only DB credentials) failed to build. The client is now
 * created on first query instead, and a build needs no database at all.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, prop) {
    return prop in getPrismaClient();
  },
});
