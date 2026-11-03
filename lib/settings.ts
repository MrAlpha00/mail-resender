import {
  MAX_RECIPIENTS_DEFAULT,
  MAX_RECIPIENTS_HARD_LIMIT,
} from "@/lib/constants";
import { resolveSenderEmail, sanitizeSenderName } from "@/lib/security";
import type { ComposerConfig } from "@/types/email";

function clampInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function getMaxRecipients(): number {
  return clampInteger(
    process.env.MAX_RECIPIENTS,
    MAX_RECIPIENTS_DEFAULT,
    1,
    MAX_RECIPIENTS_HARD_LIMIT,
  );
}

export function getGlobalDailyRecipientLimit(): number {
  return clampInteger(process.env.GLOBAL_DAILY_RECIPIENT_LIMIT, 500, 1, 100_000);
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // Fall through to the safe local default.
    }
  }
  return "http://localhost:3000";
}

export function getSenderConfig(): { name: string; email: string; from: string } | null {
  const email = resolveSenderEmail(process.env.RESEND_FROM_EMAIL);
  if (!email) return null;
  const name = sanitizeSenderName(process.env.RESEND_FROM_NAME || "MailDrop") || "MailDrop";
  return { name, email, from: `${name} <${email}>` };
}

export function getComposerConfig(): ComposerConfig {
  const sender = getSenderConfig();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const secretConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
  const apiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

  return {
    fromName: sender?.name ?? sanitizeSenderName(process.env.RESEND_FROM_NAME || "MailDrop") || "MailDrop",
    fromEmail: sender?.email ?? "Not configured",
    maxRecipients: getMaxRecipients(),
    turnstileSiteKey,
    turnstileRequired: secretConfigured || process.env.NODE_ENV === "production",
    deliveryConfigured: Boolean(sender && apiKeyConfigured),
    appUrl: getAppUrl(),
  };
}
