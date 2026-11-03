import { NextResponse } from "next/server";

import {
  AttachmentError,
  prepareAttachment,
} from "@/lib/attachments";
import {
  MAX_FILE_COUNT,
  MAX_REQUEST_BYTES,
  MAX_TOTAL_ATTACHMENT_BYTES,
} from "@/lib/constants";
import { renderEmail } from "@/lib/email-templates";
import {
  enforceRateLimit,
  reserveRecipientQuota,
} from "@/lib/rate-limit";
import { getResendClient, getSender } from "@/lib/resend";
import {
  getClientIp,
  hashIp,
  isSameOrigin,
  logEvent,
  safeResendErrorMessage,
} from "@/lib/security";
import { getMaxRecipients } from "@/lib/settings";
import { createSendPayloadSchema, toFieldErrors } from "@/lib/validation";
import type {
  RecipientResult,
  SendEmailErrorResponse,
  SendEmailSuccessResponse,
} from "@/types/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONCURRENCY_LIMIT = 3;

function jsonError(
  code: SendEmailErrorResponse["code"],
  message: string,
  status: number,
  requestId: string,
  extra: Partial<SendEmailErrorResponse> = {},
): NextResponse<SendEmailErrorResponse> {
  return NextResponse.json(
    { ok: false, code, message, requestId, ...extra },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
        ...(extra.retryAfter ? { "Retry-After": String(extra.retryAfter) } : {}),
      },
    },
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const ipHash = hashIp(getClientIp(request));

  try {
    if (!isSameOrigin(request)) {
      logEvent("request_forbidden", { requestId, ipHash, status: 403 });
      return jsonError("forbidden", "This request did not originate from MailDrop.", 403, requestId);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return jsonError(
        "unsupported_media_type",
        "Upload the email as multipart form data.",
        415,
        requestId,
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      logEvent("request_too_large", { requestId, ipHash, status: 413 });
      return jsonError(
        "payload_too_large",
        "This request is too large. Reduce the attachment size and try again.",
        413,
        requestId,
      );
    }

    const resend = getResendClient();
    const sender = getSender();
    if (!resend) {
      logEvent("not_configured", { requestId, ipHash, status: 503 });
      return jsonError(
        "not_configured",
        "Email delivery is not configured yet. Add RESEND_API_KEY and redeploy.",
        503,
        requestId,
      );
    }

    const rateLimit = await enforceRateLimit(ipHash);
    if (!rateLimit.ok) {
      logEvent("rate_limited", {
        requestId,
        ipHash,
        status: rateLimit.unavailable ? 503 : 429,
        reason: rateLimit.reason,
      });
      return jsonError(
        rateLimit.unavailable ? "not_configured" : "rate_limited",
        rateLimit.unavailable
          ? "Sending is temporarily unavailable because the Upstash Redis rate-limiting store is not configured or reachable. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, then redeploy."
          : "Too many send attempts. Please wait before trying again.",
        rateLimit.unavailable ? 503 : 429,
        requestId,
        { retryAfter: rateLimit.retryAfter },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError("invalid_request", "The submitted form could not be read.", 400, requestId);
    }

    let recipientsRaw: unknown = [];
    try {
      const raw = form.get("recipients");
      recipientsRaw = typeof raw === "string" ? JSON.parse(raw) : [];
    } catch {
      return jsonError("invalid_request", "The recipient list is invalid.", 400, requestId);
    }

    const selectedTemplate = String(form.get("selectedTemplate") ?? "");
    const submissionId = String(form.get("submissionId") ?? "");

    const parsed = createSendPayloadSchema(getMaxRecipients()).safeParse({
      recipients: recipientsRaw,
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
      selectedTemplate,
      submissionId,
    });

    if (!parsed.success) {
      logEvent("validation_failed", { requestId, ipHash, status: 400 });
      return jsonError("invalid_request", "Please check the highlighted fields.", 400, requestId, {
        fieldErrors: toFieldErrors(parsed.error),
      });
    }

    const payload = parsed.data;
    const recipients = [...new Set(payload.recipients)];

    const files = form
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length > MAX_FILE_COUNT) {
      return jsonError(
        "invalid_request",
        `You can attach up to ${MAX_FILE_COUNT} files.`,
        400,
        requestId,
      );
    }

    const prepared = [];
    let totalAttachmentBytes = 0;
    for (const file of files) {
      try {
        const attachment = await prepareAttachment(file);
        totalAttachmentBytes += attachment.size;
        if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
          return jsonError(
            "payload_too_large",
            "The combined attachments exceed the allowed total size.",
            413,
            requestId,
          );
        }
        prepared.push(attachment);
      } catch (error) {
        if (error instanceof AttachmentError) {
          return jsonError("invalid_request", error.message, 400, requestId);
        }
        return jsonError("invalid_request", "One of the attachments could not be processed.", 400, requestId);
      }
    }

    const quota = await reserveRecipientQuota(recipients.length);
    if (!quota.ok) {
      logEvent("quota_exceeded", {
        requestId,
        ipHash,
        status: quota.unavailable ? 503 : 429,
        reason: quota.reason,
      });
      return jsonError(
        quota.unavailable ? "not_configured" : "rate_limited",
        quota.unavailable
          ? "Sending is temporarily unavailable because the Upstash Redis quota store is not configured or reachable. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, then redeploy."
          : "The shared daily sending limit has been reached. Please try again tomorrow.",
        quota.unavailable ? 503 : 429,
        requestId,
        { retryAfter: quota.retryAfter },
      );
    }

    const attachmentsForProvider = prepared.map((attachment, index) => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.bytes).toString("base64"),
      contentType: attachment.contentType,
      ...(attachment.isImage
        ? { contentId: `maildrop-${requestId.slice(0, 8)}-${index}` }
        : {}),
    }));

    const attachmentsForTemplate = prepared.map((attachment, index) => ({
      filename: attachment.filename,
      size: attachment.size,
      contentType: attachment.contentType,
      ...(attachment.isImage
        ? { contentId: `maildrop-${requestId.slice(0, 8)}-${index}` }
        : {}),
    }));

    const rendered = renderEmail({
      template: payload.selectedTemplate,
      subject: payload.subject,
      message: payload.message,
      attachments: attachmentsForTemplate,
      senderName: sender.name === "MailDrop" ? "" : sender.name,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    const results = await mapWithConcurrency(
      recipients,
      CONCURRENCY_LIMIT,
      async (recipient, index): Promise<RecipientResult> => {
        try {
          const response = await resend.emails.send(
            {
              from: sender.from,
              to: [recipient],
              subject: payload.subject,
              html: rendered.html,
              text: rendered.text,
              attachments: attachmentsForProvider,
              tags: [
                { name: "source", value: "maildrop" },
                { name: "request", value: requestId },
              ],
            },
            { idempotencyKey: `maildrop-${payload.submissionId}-${index}` },
          );

          if (response.error || !response.data?.id) {
            return {
              recipient,
              status: "failed",
              error: safeResendErrorMessage(response.error),
            };
          }

          return {
            recipient,
            status: "accepted",
            id: response.data.id,
          };
        } catch (error) {
          return {
            recipient,
            status: "failed",
            error: safeResendErrorMessage(error),
          };
        }
      },
    );

    const accepted = results.filter((result) => result.status === "accepted").length;
    const failed = results.length - accepted;

    logEvent("send_processed", {
      requestId,
      ipHash,
      recipientCount: recipients.length,
      fileCount: prepared.length,
      status: 200,
      durationMs: Date.now() - startedAt,
      reason: failed > 0 ? "partial_failure" : "accepted",
    });

    const body: SendEmailSuccessResponse = {
      ok: true,
      requestId,
      results,
      summary: {
        total: results.length,
        accepted,
        failed,
      },
    };

    return NextResponse.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    logEvent("server_error", {
      requestId,
      ipHash,
      status: 500,
      durationMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.name : "unknown",
    });
    console.error("[maildrop:server_error]", requestId, error instanceof Error ? error.name : "Unknown");
    return jsonError(
      "server_error",
      "Something went wrong while submitting your email. No delivery was confirmed.",
      500,
      requestId,
    );
  }
}
