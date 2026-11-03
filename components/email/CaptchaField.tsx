"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { RefObject } from "react";

interface CaptchaFieldProps {
  siteKey: string;
  required: boolean;
  captchaRef: RefObject<TurnstileInstance | null>;
  onToken: (token: string) => void;
  onError?: () => void;
  disabled?: boolean;
}

export function CaptchaField({
  siteKey,
  required,
  captchaRef,
  onToken,
  onError,
  disabled = false,
}: CaptchaFieldProps) {
  if (siteKey) {
    return (
      <div className={disabled ? "pointer-events-none opacity-60" : ""}>
        <Turnstile
          ref={captchaRef}
          siteKey={siteKey}
          options={{
            theme: "light",
            size: "flexible",
            action: "maildrop_send",
            appearance: "always",
          }}
          onSuccess={(token) => onToken(token)}
          onExpire={() => onToken("")}
          onError={() => {
            onToken("");
            onError?.();
          }}
          className="min-h-[65px]"
        />
      </div>
    );
  }

  if (required) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          Bot protection is required but the site key is missing. Add{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>{" "}
          to your environment to enable sending.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-[11px] leading-5 text-emerald-800">
      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
      <span>
        Local development mode — CAPTCHA verification is skipped because Turnstile is not
        configured. Production fails closed until it is.
      </span>
    </div>
  );
}
