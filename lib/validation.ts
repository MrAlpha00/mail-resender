import { z } from "zod";

import {
  EMAIL_TEMPLATE_IDS,
  type EmailTemplateId,
} from "@/types/email";
import {
  MAX_MESSAGE_LENGTH,
  MAX_RECIPIENTS_DEFAULT,
  MAX_RECIPIENTS_HARD_LIMIT,
  MAX_SUBJECT_LENGTH,
} from "@/lib/constants";

const emailValidator = z.email();

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  return (
    normalized.length > 2 &&
    normalized.length <= 254 &&
    !/[\r\n<>]/.test(normalized) &&
    emailValidator.safeParse(normalized).success
  );
}

export const emailAddressSchema = z
  .string({ error: "Enter a valid email address." })
  .trim()
  .max(254, "Email addresses must be 254 characters or fewer.")
  .refine(isValidEmail, "Enter a valid email address.")
  .transform(normalizeEmail);

export function createRecipientListSchema(maxRecipients: number) {
  const limit = Math.max(
    1,
    Math.min(
      MAX_RECIPIENTS_HARD_LIMIT,
      Number.isFinite(maxRecipients) ? Math.trunc(maxRecipients) : MAX_RECIPIENTS_DEFAULT,
    ),
  );

  return z
    .array(emailAddressSchema, { error: "Add at least one recipient." })
    .min(1, "Add at least one recipient.")
    .max(limit, `You can send to up to ${limit} recipients at a time.`);
}

export const composerTextSchema = z.object({
  subject: z
    .string({ error: "Enter an email subject." })
    .trim()
    .min(1, "Enter an email subject.")
    .max(MAX_SUBJECT_LENGTH, `Keep the subject under ${MAX_SUBJECT_LENGTH} characters.`)
    .refine(
      (value) => !/[\r\n]/.test(value),
      "The subject cannot contain line breaks.",
    ),
  message: z
    .string({ error: "Write a message before sending." })
    .trim()
    .min(1, "Write a message before sending.")
    .max(MAX_MESSAGE_LENGTH, `Keep your message under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Your message contains unsupported control characters.",
    ),
});

export const templateIdSchema = z.enum(EMAIL_TEMPLATE_IDS, {
  error: "Choose an email template.",
});

export function createSendPayloadSchema(maxRecipients: number) {
  return z.object({
    recipients: createRecipientListSchema(maxRecipients),
    subject: composerTextSchema.shape.subject,
    message: composerTextSchema.shape.message,
    selectedTemplate: templateIdSchema,
    submissionId: z.uuid("The submission identifier is invalid."),
  });
}

export type SendPayload = z.infer<ReturnType<typeof createSendPayloadSchema>>;
export type TemplateId = z.infer<typeof templateIdSchema>;
export type ComposerTextInput = z.input<typeof composerTextSchema>;

export function normalizeMessage(message: string): string {
  return message
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function normalizeRecipients(values: string[], maxRecipients: number): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    const normalized = normalizeEmail(value);
    if (isValidEmail(normalized)) unique.add(normalized);
    if (unique.size >= maxRecipients) break;
  }
  return [...unique];
}

export function splitRecipientText(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Convert Zod issues into a small, field-keyed shape. Only the first message
 * per field is kept to keep API errors readable.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    if (!fieldErrors[key]) fieldErrors[key] = [issue.message];
  }
  return fieldErrors;
}

export function isEmailTemplateId(value: string): value is EmailTemplateId {
  return (EMAIL_TEMPLATE_IDS as readonly string[]).includes(value);
}
