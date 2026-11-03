import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import {
  RATE_LIMIT_LONG_MAX,
  RATE_LIMIT_LONG_WINDOW,
  RATE_LIMIT_SHORT_MAX,
  RATE_LIMIT_SHORT_WINDOW,
} from "@/lib/constants";
import { getGlobalDailyRecipientLimit } from "@/lib/settings";

export interface RateLimitResult {
  ok: boolean;
  reason?: "rate_limited" | "quota_exceeded" | "unavailable";
  retryAfter?: number;
  unavailable?: boolean;
}

interface MemoryBucket {
  timestamps: number[];
}

const memoryBuckets = new Map<string, MemoryBucket>();
const memoryQuota = new Map<string, number>();

let redis: Redis | null | undefined;
let shortLimiter: Ratelimit | null = null;
let longLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  if (redis === undefined) {
    redis = new Redis({ url, token, enableTelemetry: false });
  }
  return redis;
}

function getLimiters(): { short: Ratelimit; long: Ratelimit } | null {
  const store = getRedis();
  if (!store) return null;
  if (!shortLimiter || !longLimiter) {
    shortLimiter = new Ratelimit({
      redis: store,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_SHORT_MAX, RATE_LIMIT_SHORT_WINDOW),
      prefix: "maildrop:rl:short",
      analytics: false,
    });
    longLimiter = new Ratelimit({
      redis: store,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_LONG_MAX, RATE_LIMIT_LONG_WINDOW),
      prefix: "maildrop:rl:long",
      analytics: false,
    });
  }
  return { short: shortLimiter, long: longLimiter };
}

function memoryRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < windowMs);
  if (bucket.timestamps.length >= max) {
    memoryBuckets.set(key, bucket);
    const oldest = bucket.timestamps[0] ?? now;
    return {
      ok: false,
      reason: "rate_limited",
      retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  bucket.timestamps.push(now);
  memoryBuckets.set(key, bucket);

  // Bound memory in local development.
  if (memoryBuckets.size > 2_000) {
    for (const [bucketKey, value] of memoryBuckets) {
      if (value.timestamps.every((timestamp) => now - timestamp >= windowMs)) {
        memoryBuckets.delete(bucketKey);
      }
    }
  }
  return { ok: true };
}

/**
 * Per-IP abuse protection. Uses Upstash Redis when configured. In production a
 * missing store fails closed; local development falls back to an in-memory
 * limiter so the composer can be exercised without cloud credentials.
 */
export async function enforceRateLimit(ipHash: string): Promise<RateLimitResult> {
  const limiters = getLimiters();

  if (limiters) {
    try {
      const [shortResult, longResult] = await Promise.all([
        limiters.short.limit(ipHash),
        limiters.long.limit(ipHash),
      ]);

      if (!shortResult.success) {
        return {
          ok: false,
          reason: "rate_limited",
          retryAfter: Math.max(1, Math.ceil((shortResult.reset - Date.now()) / 1000)),
        };
      }

      if (!longResult.success) {
        return {
          ok: false,
          reason: "rate_limited",
          retryAfter: Math.max(1, Math.ceil((longResult.reset - Date.now()) / 1000)),
        };
      }

      return { ok: true };
    } catch {
      console.warn("[maildrop:security] Rate-limit store unavailable.");
      return { ok: false, reason: "unavailable", unavailable: true, retryAfter: 60 };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, reason: "unavailable", unavailable: true, retryAfter: 60 };
  }

  const short = memoryRateLimit(`short:${ipHash}`, RATE_LIMIT_SHORT_MAX, 10 * 60 * 1000);
  if (!short.ok) return short;
  return memoryRateLimit(`long:${ipHash}`, RATE_LIMIT_LONG_MAX, 24 * 60 * 60 * 1000);
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(60, Math.ceil((midnight - now.getTime()) / 1000));
}

/**
 * A global daily ceiling on total recipient copies. This protects the Resend
 * account even if many distinct IPs are used.
 */
export async function reserveRecipientQuota(
  recipientCount: number,
): Promise<RateLimitResult> {
  const limit = getGlobalDailyRecipientLimit();
  const dateKey = new Date().toISOString().slice(0, 10);
  const key = `maildrop:quota:${dateKey}`;
  const store = getRedis();

  if (store) {
    try {
      const next = await store.incr(key);
      if (next === 1) {
        await store.expire(key, 60 * 60 * 48);
      }
      if (next > limit) {
        await store.decr(key);
        return {
          ok: false,
          reason: "quota_exceeded",
          retryAfter: secondsUntilUtcMidnight(),
        };
      }
      return { ok: true };
    } catch {
      console.warn("[maildrop:security] Recipient quota store unavailable.");
      return { ok: false, reason: "unavailable", unavailable: true, retryAfter: 60 };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, reason: "unavailable", unavailable: true, retryAfter: 60 };
  }

  const current = memoryQuota.get(key) ?? 0;
  if (current + recipientCount > limit) {
    return {
      ok: false,
      reason: "quota_exceeded",
      retryAfter: secondsUntilUtcMidnight(),
    };
  }
  memoryQuota.set(key, current + recipientCount);
  return { ok: true };
}
