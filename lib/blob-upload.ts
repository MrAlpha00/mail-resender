import { upload } from "@vercel/blob/client";

import { getAttachmentSpec } from "@/lib/attachments";
import type { LocalAttachment, UploadedAttachmentMeta } from "@/types/email";

/**
 * Upload attachments directly from the browser to the private Vercel Blob
 * store. Only pathname and filename metadata is sent to /api/send-email.
 */
export async function uploadAttachments(
  submissionId: string,
  attachments: LocalAttachment[],
  onProgress: (progress: number) => void,
): Promise<UploadedAttachmentMeta[]> {
  if (attachments.length === 0) return [];

  const totalBytes = attachments.reduce((sum, attachment) => sum + attachment.file.size, 0);
  let completedBytes = 0;
  const uploaded: UploadedAttachmentMeta[] = [];

  for (const attachment of attachments) {
    const file = attachment.file;
    const spec = getAttachmentSpec(file.name);
    const contentType = spec?.mimes[0] || file.type || "application/octet-stream";
    const pathname = `maildrop/${submissionId}/${crypto.randomUUID()}`;

    const blob = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/blob/upload",
      contentType,
      clientPayload: JSON.stringify({
        submissionId,
        filename: file.name,
        size: file.size,
        contentType,
      }),
      onUploadProgress: (event) => {
        if (totalBytes <= 0) return;
        const loaded = completedBytes + event.loaded;
        onProgress(Math.min(99, Math.round((loaded / totalBytes) * 100)));
      },
    });

    completedBytes += file.size;
    uploaded.push({ pathname: blob.pathname, filename: file.name });
  }

  onProgress(100);
  return uploaded;
}
