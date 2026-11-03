export type EmailTemplateId = "professional" | "minimal" | "dark";

export const EMAIL_TEMPLATE_IDS = ["professional", "minimal", "dark"] as const;

export interface EmailTemplateMeta {
  id: EmailTemplateId;
  name: string;
  description: string;
  /** Small palette used by the template picker UI. */
  swatches: {
    page: string;
    card: string;
    accent: string;
  };
}

export const EMAIL_TEMPLATES: readonly EmailTemplateMeta[] = [
  {
    id: "professional",
    name: "Modern Professional",
    description: "A polished white card with refined type and a confident navy accent.",
    swatches: { page: "#f1f5f9", card: "#ffffff", accent: "#2563eb" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet typography, generous space, and nothing that gets in the way.",
    swatches: { page: "#ffffff", card: "#ffffff", accent: "#0f172a" },
  },
  {
    id: "dark",
    name: "Elegant Dark",
    description: "A deep midnight canvas with bright, high-contrast details.",
    swatches: { page: "#070d1a", card: "#0f172a", accent: "#60a5fa" },
  },
] as const;

export interface AttachmentMeta {
  filename: string;
  size: number;
  contentType: string;
  /** Present when the browser has a local preview URL. */
  previewUrl?: string;
  /** Present on the server for inline image attachments. */
  contentId?: string;
}

export interface RecipientResult {
  recipient: string;
  status: "accepted" | "failed";
  /** Resend email id. Present only when the provider accepted the copy. */
  id?: string;
  /** Human-readable, non-sensitive failure reason. */
  error?: string;
}

export interface SendEmailSuccessResponse {
  ok: true;
  requestId: string;
  results: RecipientResult[];
  summary: {
    total: number;
    accepted: number;
    failed: number;
  };
}

export interface SendEmailErrorResponse {
  ok: false;
  requestId: string;
  code:
    | "invalid_request"
    | "captcha_failed"
    | "rate_limited"
    | "payload_too_large"
    | "unsupported_media_type"
    | "not_configured"
    | "forbidden"
    | "send_failed"
    | "server_error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  retryAfter?: number;
}

export type SendEmailResponse = SendEmailSuccessResponse | SendEmailErrorResponse;

export interface ComposerConfig {
  fromName: string;
  fromEmail: string;
  maxRecipients: number;
  deliveryConfigured: boolean;
  /** True while the fixed Resend test sender is in use. */
  resendTestMode: boolean;
  appUrl: string;
}

export interface ComposerTextValues {
  subject: string;
  message: string;
}

export interface LocalAttachment {
  id: string;
  file: File;
  previewUrl: string | null;
  isImage: boolean;
}
