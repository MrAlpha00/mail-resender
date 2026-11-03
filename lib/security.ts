import { createHash } from "node:crypto";

import { isValidEmail, normalizeEmail } from "@/lib/validation";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  const cleaned = candidate.replace(/[^\da-fA-F:.]/g, "").slice(0, 64);
  return cleaned || "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.ABUSE_HASH_SALT?.trim() || "maildrop-abuse-monitor";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 20);
}

/** Reject cross-origin browser submissions. Requests without Origin are allowed. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const requestHost = new URL(request.url).host;
    return originHost === (forwardedHost || requestHost);
  } catch {
    return false;
  }
}

export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\u0000]/g, " ").trim();
}

export function sanitizeSenderName(value: string): string {
  return sanitizeHeaderValue(value)
    .replace(/[<>"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function resolveSenderEmail(value: string | undefined): string | null {
  const normalized = normalizeEmail(value ?? "");
  return isValidEmail(normalized) ? normalized : null;
}

/**
 * Map provider failures to stable, non-sensitive messages. Full provider
 * details are intentionally never forwarded to the browser.
 */
export function safeResendErrorMessage(error: unknown): string {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  const combined = `${name} ${message}`.toLowerCase();

  if (combined.includes("idempotency")) {
    return "This copy was already submitted. Duplicate delivery was prevented.";
  }
  if (combined.includes("rate") && combined.includes("limit")) {
    return "The email provider is receiving too many requests. Try again shortly.";
  }
  if (
    combined.includes("api key") ||
    combined.includes("unauthorized") ||
    combined.includes("forbidden") ||
    combined.includes("domain")
  ) {
    return "Email delivery is not configured correctly. Please contact the site owner.";
  }
  if (combined.includes("validation") || combined.includes("invalid")) {
    return "The email provider rejected this message. Check the recipient address and try again.";
  }
  return "The email provider could not accept this copy. Please try again.";
}

interface MonitoringFields {
  requestId: string;
  ipHash: string;
  recipientCount?: number;
  fileCount?: number;
  status?: number;
  durationMs?: number;
  reason?: string;
}

/**
 * Structured abuse/health logging. Never include recipients, subject, message
 * bodies, filenames, or attachment contents.
 */
export function logEvent(event: string, fields: MonitoringFields): void {
  const payload = {
    scope: "maildrop",
    event,
    at: new Date().toISOString(),
    ...fields,
  };
  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify(payload));
  } else {
    console.info(`[maildrop:${event}]`, payload);
  }
}
