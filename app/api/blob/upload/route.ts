import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getAttachmentSpec, sanitizeFilename } from "@/lib/attachments";
import {
  ALLOWED_ATTACHMENT_TYPES,
  BLOB_UPLOAD_TTL_MS,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/constants";
import { enforceUploadRateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp, isSameOrigin, logEvent } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_CONTENT_TYPES = Array.from(
  new Set(ALLOWED_ATTACHMENT_TYPES.flatMap((type) => [...type.mimes])),
);

interface UploadClientPayload {
  submissionId?: unknown;
  filename?: unknown;
  size?: unknown;
  contentType?: unknown;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const ipHash = hashIp(getClientIp(request));

  if (!isSameOrigin(request)) {
    logEvent("blob_upload_denied", { requestId, ipHash, status: 403, reason: "origin" });
    return jsonError("This upload did not originate from MailDrop.", 403);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    logEvent("blob_upload_denied", { requestId, ipHash, status: 503, reason: "not_configured" });
    return jsonError("Attachment storage is not configured yet.", 503);
  }

  const rateLimit = await enforceUploadRateLimit(ipHash);
  if (!rateLimit.ok) {
    logEvent("blob_upload_denied", {
      requestId,
      ipHash,
      status: rateLimit.unavailable ? 503 : 429,
      reason: rateLimit.reason,
    });
    return jsonError(
      rateLimit.unavailable
        ? "Attachment uploads are temporarily unavailable."
        : "Too many attachment uploads. Please wait before trying again.",
      rateLimit.unavailable ? 503 : 429,
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonError("The upload request could not be read.", 400);
  }

  try {
    const result = await handleUpload({
      token,
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload: UploadClientPayload;
        try {
          payload = JSON.parse(clientPayload ?? "{}") as UploadClientPayload;
        } catch {
          throw new Error("Invalid upload metadata.");
        }

        const submissionId =
          typeof payload.submissionId === "string" ? payload.submissionId : "";
        if (!UUID_PATTERN.test(submissionId)) {
          throw new Error("Invalid submission.");
        }

        const pathParts = pathname.split("/");
        if (
          pathParts.length !== 3 ||
          pathParts[0] !== "maildrop" ||
          pathParts[1] !== submissionId ||
          !UUID_PATTERN.test(pathParts[2])
        ) {
          throw new Error("Invalid upload path.");
        }

        const filename =
          typeof payload.filename === "string" ? sanitizeFilename(payload.filename) : "";
        const spec = getAttachmentSpec(filename);
        if (!spec) {
          throw new Error("This file type is not allowed.");
        }

        const size = typeof payload.size === "number" ? payload.size : Number.NaN;
        if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE_BYTES) {
          throw new Error("This file is too large.");
        }

        const contentType =
          typeof payload.contentType === "string"
            ? payload.contentType.trim().toLowerCase()
            : "";
        if (!spec.mimes.includes(contentType)) {
          throw new Error("This file type is not allowed.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
          validUntil: Date.now() + BLOB_UPLOAD_TTL_MS,
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    logEvent("blob_upload_denied", {
      requestId,
      ipHash,
      status: 400,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError("The attachment could not be uploaded.", 400);
  }
}
