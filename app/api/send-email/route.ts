import { del, get, head, type GetBlobResult } from "@vercel/blob";
import { NextResponse } from "next/server";

import {
  estimateAttachmentPayloadBytes,
  sanitizeFilename,
  validateAttachment,
  verifyFileSignature,
  type PreparedAttachment,
} from "@/lib/attachments";
import {
  BLOB_UPLOAD_TTL_MS,
  MAX_FILE_COUNT,
  MAX_REQUEST_BYTES,
  MAX_RESEND_ATTACHMENT_BYTES,
  MAX_TOTAL_ATTACHMENT_BYTES,
  RESEND_MAX_EMAIL_BYTES,
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
import { formatBytes } from "@/lib/utils";
import { createSendPayloadSchema, toFieldErrors } from "@/lib/validation";
import type {
  RecipientResult,
  SendEmailErrorResponse,
  SendEmailSuccessResponse,
  UploadedAttachmentMeta,
} from "@/types/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONCURRENCY_LIMIT = 3;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PendingBlobAttachment {
  pathname: string;
  filename: string;
  size: number;
  contentType: string;
  extension: string;
  isImage: boolean;
}

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
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? null;
  let blobPathnames: string[] = [];

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

    const legacyFiles = form
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (legacyFiles.length > 0) {
      return jsonError(
        "invalid_request",
        "Please refresh MailDrop and upload your attachments again.",
        400,
        requestId,
      );
    }

    let attachmentsRaw: unknown = [];
    try {
      const raw = form.get("attachments");
      attachmentsRaw = typeof raw === "string" && raw.length > 0 ? JSON.parse(raw) : [];
    } catch {
      return jsonError("invalid_request", "The attachment list is invalid.", 400, requestId);
    }

    if (!Array.isArray(attachmentsRaw)) {
      return jsonError("invalid_request", "The attachment list is invalid.", 400, requestId);
    }

    if (attachmentsRaw.length > MAX_FILE_COUNT) {
      return jsonError(
        "invalid_request",
        `You can attach up to ${MAX_FILE_COUNT} files.`,
        400,
        requestId,
      );
    }

    const blobAttachments: UploadedAttachmentMeta[] = [];
    for (const entry of attachmentsRaw) {
      if (typeof entry !== "object" || entry === null) {
        return jsonError("invalid_request", "The attachment list is invalid.", 400, requestId);
      }
      const record = entry as Record<string, unknown>;
      const pathname = typeof record.pathname === "string" ? record.pathname : "";
      const filename = typeof record.filename === "string" ? record.filename : "";
      if (!pathname || !filename) {
        return jsonError("invalid_request", "The attachment list is invalid.", 400, requestId);
      }
      blobAttachments.push({ pathname, filename });
    }

    const expectedPrefix = `maildrop/${payload.submissionId}/`;
    for (const attachment of blobAttachments) {
      const fileId = attachment.pathname.startsWith(expectedPrefix)
        ? attachment.pathname.slice(expectedPrefix.length)
        : "";
      if (!UUID_PATTERN.test(fileId)) {
        return jsonError(
          "invalid_request",
          "One of the attachments is invalid. Remove it and try again.",
          400,
          requestId,
        );
      }
    }

    if (new Set(blobAttachments.map((attachment) => attachment.pathname)).size !== blobAttachments.length) {
      return jsonError("invalid_request", "The attachment list is invalid.", 400, requestId);
    }

    blobPathnames = blobAttachments.map((attachment) => attachment.pathname);

    const prepared: PreparedAttachment[] = [];
    let totalAttachmentBytes = 0;
    let totalEncodedAttachmentBytes = 0;

    if (blobAttachments.length > 0) {
      if (!blobToken) {
        return jsonError(
          "not_configured",
          "Attachment storage is not configured yet. Add BLOB_READ_WRITE_TOKEN and redeploy.",
          503,
          requestId,
        );
      }

      const pending: PendingBlobAttachment[] = [];

      for (const attachment of blobAttachments) {
        let metadata;
        try {
          metadata = await head(attachment.pathname, { token: blobToken });
        } catch {
          return jsonError(
            "invalid_request",
            "One of the attachments is no longer available. Remove it and try again.",
            400,
            requestId,
          );
        }

        if (Date.now() - metadata.uploadedAt.getTime() > BLOB_UPLOAD_TTL_MS) {
          return jsonError(
            "invalid_request",
            "One of the attachments expired. Remove it and try again.",
            400,
            requestId,
          );
        }

        const filename = sanitizeFilename(attachment.filename);
        const validation = validateAttachment({
          name: filename,
          size: metadata.size,
          type: metadata.contentType,
        });

        if (!validation.ok || !validation.spec || !validation.extension) {
          return jsonError(
            "invalid_request",
            validation.error ?? "One of the attachments is not allowed.",
            400,
            requestId,
          );
        }

        totalAttachmentBytes += metadata.size;
        if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
          return jsonError(
            "payload_too_large",
            `The combined attachments exceed the ${formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)} limit.`,
            413,
            requestId,
          );
        }

        const isImage = validation.spec.kind === "image";
        totalEncodedAttachmentBytes += estimateAttachmentPayloadBytes(metadata.size, isImage);
        if (totalEncodedAttachmentBytes > MAX_RESEND_ATTACHMENT_BYTES) {
          return jsonError(
            "payload_too_large",
            `The encoded email would exceed Resend's ${formatBytes(RESEND_MAX_EMAIL_BYTES)} limit. Images are included twice for inline preview, so remove a file or use a smaller one.`,
            413,
            requestId,
          );
        }

        pending.push({
          pathname: attachment.pathname,
          filename,
          size: metadata.size,
          contentType: validation.spec.mimes[0] ?? "application/octet-stream",
          extension: validation.extension,
          isImage,
        });
      }

      for (const attachment of pending) {
        let result: GetBlobResult;
        try {
          result = await get(attachment.pathname, {
            access: "private",
            token: blobToken,
            useCache: false,
          });
        } catch {
          return jsonError(
            "invalid_request",
            "One of the attachments could not be read. Remove it and try again.",
            400,
            requestId,
          );
        }

        if (!result || result.statusCode !== 200) {
          return jsonError(
            "invalid_request",
            "One of the attachments is no longer available. Remove it and try again.",
            400,
            requestId,
          );
        }

        const bytes = new Uint8Array(await new Response(result.stream).arrayBuffer());
        if (bytes.length !== attachment.size) {
          return jsonError(
            "invalid_request",
            "One of the attachments could not be verified. Remove it and try again.",
            400,
            requestId,
          );
        }

        if (!verifyFileSignature(bytes, attachment.extension)) {
          return jsonError(
            "invalid_request",
            `“${attachment.filename}” does not match its file type. Please upload the original file.`,
            400,
            requestId,
          );
        }

        prepared.push({
          filename: attachment.filename,
          size: bytes.length,
          contentType: attachment.contentType,
          extension: attachment.extension,
          isImage: attachment.isImage,
          bytes,
        });
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

    const attachmentsForProvider = prepared.flatMap((attachment, index) => {
      const downloadable = {
        filename: attachment.filename,
        content: Buffer.from(attachment.bytes).toString("base64"),
        contentType: attachment.contentType,
      };

      if (!attachment.isImage) return [downloadable];

      // Images are sent twice: one CID part for the inline preview and one
      // regular attachment so every client exposes a native download.
      return [
        {
          ...downloadable,
          contentId: `maildrop-${requestId.slice(0, 8)}-${index}`,
        },
        downloadable,
      ];
    });

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
  } finally {
    if (blobToken && blobPathnames.length > 0) {
      try {
        await del(blobPathnames, { token: blobToken });
      } catch {
        console.warn("[maildrop:attachments] Temporary blob cleanup failed.");
      }
    }
  }
}
