import { Resend } from "resend";

import { getSenderConfig } from "@/lib/settings";

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

export function getSender() {
  return getSenderConfig();
}
