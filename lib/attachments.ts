import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_FILE_COUNT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILENAME_LENGTH,
  MAX_TOTAL_ATTACHMENT_BYTES,
  type AllowedAttachmentType,
} from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

export interface AttachmentValidationOptions {
  existingCount?: number;
  existingBytes?: number;
}

export interface AttachmentValidation {
  ok: boolean;
  error?: string;
  spec?: AllowedAttachmentType;
  extension?: string;
}

export function getExtension(filename: string): string {
  const cleaned = filename.trim().toLowerCase();
  const lastDot = cleaned.lastIndexOf(".");
  if (lastDot < 1 || lastDot === cleaned.length - 1) return "";
  return cleaned.slice(lastDot + 1);
}

export function getAttachmentSpec(filename: string): AllowedAttachmentType | undefined {
  const extension = getExtension(filename);
  if (!extension) return undefined;
  return ALLOWED_ATTACHMENT_TYPES.find((type) => type.extensions.includes(extension));
}

export function isImageFilename(filename: string): boolean {
  return getAttachmentSpec(filename)?.kind === "image";
}

/**
 * Estimate the Base64-encoded attachment payload Resend receives. Images are
 * counted twice because they are sent once with a CID for inline preview and
 * once as a normal downloadable attachment.
 */
export function estimateAttachmentPayloadBytes(size: number, isImage: boolean): number {
  const encoded = 4 * Math.ceil(Math.max(0, size) / 3);
  return encoded * (isImage ? 2 : 1);
}

export function sanitizeFilename(filename: string): string {
  const base = filename
    .split(/[\\/]/)
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"|?*]/g, "-")
    .replace(/^\.+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) return "attachment";

  const extension = getExtension(base);
  if (base.length <= MAX_FILENAME_LENGTH) return base;

  const suffix = extension ? `.${extension}` : "";
  const stemLength = Math.max(1, MAX_FILENAME_LENGTH - suffix.length);
  return `${base.slice(0, stemLength).trimEnd()}${suffix}`;
}

export function validateAttachment(
  file: Pick<File, "name" | "size" | "type">,
  options: AttachmentValidationOptions = {},
): AttachmentValidation {
  const filename = sanitizeFilename(file.name);
  const extension = getExtension(filename);
  const spec = getAttachmentSpec(filename);
  const existingCount = options.existingCount ?? 0;
  const existingBytes = options.existingBytes ?? 0;

  if (!spec) {
    return {
      ok: false,
      error: `“${filename}” is not an approved file type.`,
    };
  }

  if (existingCount >= MAX_FILE_COUNT) {
    return {
      ok: false,
      error: `You can attach up to ${MAX_FILE_COUNT} files per email.`,
    };
  }

  if (file.size <= 0) {
    return { ok: false, error: `“${filename}” is empty.` };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `“${filename}” is ${formatBytes(file.size)}. Each file must be ${formatBytes(MAX_FILE_SIZE_BYTES)} or smaller.`,
    };
  }

  if (existingBytes + file.size > MAX_TOTAL_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `This upload would exceed the ${formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)} total attachment limit.`,
    };
  }

  const declaredType = file.type.trim().toLowerCase();
  const mimeAccepted =
    !declaredType ||
    declaredType === "application/octet-stream" ||
    spec.mimes.includes(declaredType);

  if (!mimeAccepted) {
    return {
      ok: false,
      error: `“${filename}” does not look like a valid ${spec.label}.`,
    };
  }

  return { ok: true, spec, extension };
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function hasBytes(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Lightweight signature check to make sure a renamed executable (for example)
 * cannot masquerade as an approved image or document.
 */
export function verifyFileSignature(bytes: Uint8Array, extension: string): boolean {
  if (bytes.length === 0) return false;

  switch (extension) {
    case "jpg":
    case "jpeg":
      return hasBytes(bytes, [0xff, 0xd8, 0xff]);
    case "png":
      return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "gif":
      return ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a";
    case "webp":
      return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
    case "pdf": {
      const header = ascii(bytes, 0, Math.min(bytes.length, 1024));
      return header.includes("%PDF-");
    }
    case "docx":
    case "xlsx":
    case "pptx":
    case "odt":
    case "ods":
    case "odp":
      return hasBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) || hasBytes(bytes, [0x50, 0x4b, 0x05, 0x06]);
    case "doc":
    case "xls":
    case "ppt":
      return hasBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "rtf":
      return ascii(bytes, 0, 5) === "{\\rtf";
    case "txt":
    case "csv": {
      const sample = bytes.slice(0, 512);
      return !sample.includes(0);
    }
    default:
      return false;
  }
}

export interface PreparedAttachment {
  filename: string;
  size: number;
  contentType: string;
  extension: string;
  isImage: boolean;
  bytes: Uint8Array;
}

/**
 * Server-side attachment processing. Files stay in memory only for the life of
 * the request and are discarded as soon as the email request completes.
 */
export async function prepareAttachment(file: File): Promise<PreparedAttachment> {
  const validation = validateAttachment(file);
  if (!validation.ok || !validation.spec || !validation.extension) {
    throw new AttachmentError(validation.error ?? "This attachment is not allowed.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!verifyFileSignature(bytes, validation.extension)) {
    throw new AttachmentError(
      `“${sanitizeFilename(file.name)}” does not match its file type. Please upload the original file.`,
    );
  }

  return {
    filename: sanitizeFilename(file.name),
    size: file.size,
    contentType: validation.spec.mimes[0] ?? "application/octet-stream",
    extension: validation.extension,
    isImage: validation.spec.kind === "image",
    bytes,
  };
}

export class AttachmentError extends Error {}
