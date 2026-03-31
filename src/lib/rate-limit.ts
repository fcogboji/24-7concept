import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const authStore = new Map<string, Entry>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

function useUpstash(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let redisSingleton: Redis | null = null;
function getRedis(): Redis | null {
  if (!useUpstash()) return null;
  if (!redisSingleton) {
    redisSingleton = Redis.fromEnv();
  }
  return redisSingleton;
}

let chatRatelimit: Ratelimit | null = null;
function getChatRatelimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!chatRatelimit) {
    chatRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      prefix: "247concept:rl:chat",
    });
  }
  return chatRatelimit;
}

/** 5 requests per 15 minutes (forgot-password, register). */
let auth15mRatelimit: Ratelimit | null = null;
function getAuth15mRatelimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!auth15mRatelimit) {
    auth15mRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "247concept:rl:auth15",
    });
  }
  return auth15mRatelimit;
}

/** 3 requests per hour (resend verification). */
let auth1hRatelimit: Ratelimit | null = null;
function getAuth1hRatelimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!auth1hRatelimit) {
    auth1hRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 m"),
      prefix: "247concept:rl:auth60",
    });
  }
  return auth1hRatelimit;
}

function memoryRateLimitChat(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return { ok: true };
  }

  if (entry.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

function memoryRateLimitAuth(
  key: string,
  max: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  let entry = authStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    authStore.set(key, entry);
    return { ok: true };
  }

  if (entry.count >= max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

/** Widget + API chat: 30 requests / minute per IP + bot. Uses Upstash when configured. */
export async function rateLimitChat(
  key: string
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const rl = getChatRatelimit();
  if (rl) {
    const { success, reset } = await rl.limit(key);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return { ok: false, retryAfter };
    }
    return { ok: true };
  }
  return memoryRateLimitChat(key);
}

/**
 * Auth-adjacent routes with configurable window (memory) or fixed presets (Upstash).
 * Known combos: 5/15m → shared limiter; 3/60m → hourly limiter.
 */
export async function rateLimitAuth(
  key: string,
  max: number,
  windowMs: number
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  if (max === 5 && windowMs === 15 * 60 * 1000) {
    const rl = getAuth15mRatelimit();
    if (rl) {
      const { success, reset } = await rl.limit(key);
      if (!success) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
      }
      return { ok: true };
    }
  } else if (max === 3 && windowMs === 60 * 60 * 1000) {
    const rl = getAuth1hRatelimit();
    if (rl) {
      const { success, reset } = await rl.limit(key);
      if (!success) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
      }
      return { ok: true };
    }
  }

  return memoryRateLimitAuth(key, max, windowMs);
}
