interface TurnstileVerification {
  ok: boolean;
  skipped?: boolean;
  configurationError?: boolean;
  message?: string;
}

interface TurnstileSiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

const TURNSTILE_ACTION = "maildrop_send";

export async function verifyTurnstile(
  token: string,
  remoteIp: string,
): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    // Local development can run without Cloudflare credentials. Production
    // deliberately fails closed rather than becoming an open relay.
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        configurationError: true,
        message: "Bot protection is not configured on the server.",
      };
    }
    return { ok: true, skipped: true };
  }

  if (!token || token.length > 4096) {
    return { ok: false, message: "Complete the bot-protection check and try again." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });

  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );

    if (!response.ok) {
      return { ok: false, message: "Bot protection is temporarily unavailable. Try again." };
    }

    const result = (await response.json()) as TurnstileSiteverifyResponse;

    if (!result.success) {
      return { ok: false, message: "Bot-protection verification failed. Please try again." };
    }

    if (result.action && result.action !== TURNSTILE_ACTION) {
      return { ok: false, message: "Bot-protection verification failed. Please try again." };
    }

    const expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim();
    if (expectedHostname && result.hostname !== expectedHostname) {
      return { ok: false, message: "Bot-protection verification failed. Please try again." };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Bot protection is temporarily unavailable. Try again." };
  }
}

export { TURNSTILE_ACTION };
