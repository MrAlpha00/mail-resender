/**
 * Shared application limits.
 *
 * These values are used by both the browser and the server. Server-side values
 * are authoritative; the client mirrors them for friendly validation.
 *
 * Vercel Functions enforce a 4.5 MB request body limit. MailDrop keeps the
 * total attachment budget below that ceiling while remaining far under
 * Resend's 40 MB per-email attachment limit.
 */
export const MAX_RECIPIENTS_DEFAULT = 15;
export const MAX_RECIPIENTS_HARD_LIMIT = 50;

/**
 * Fixed production sender. The domain must be verified in Resend before live
 * delivery is accepted. This value is server-controlled and is never exposed
 * as an editable sender field in the browser.
 */
export const MAILDROP_SENDER = {
  name: "MailDrop",
  email: "no-reply@maildrops.online",
  from: "MailDrop <no-reply@maildrops.online>",
} as const;

export const MAX_FILE_COUNT = 10;
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB per file
export const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB total
export const MAX_REQUEST_BYTES = 4.4 * 1024 * 1024; // includes multipart overhead

export const MAX_SUBJECT_LENGTH = 150;
export const MAX_MESSAGE_LENGTH = 10_000;
export const MAX_FILENAME_LENGTH = 120;

export interface AllowedAttachmentType {
  extensions: readonly string[];
  mimes: readonly string[];
  label: string;
  kind: "image" | "document";
}

export const ALLOWED_ATTACHMENT_TYPES: readonly AllowedAttachmentType[] = [
  {
    extensions: ["jpg", "jpeg"],
    mimes: ["image/jpeg"],
    label: "JPEG image",
    kind: "image",
  },
  { extensions: ["png"], mimes: ["image/png"], label: "PNG image", kind: "image" },
  { extensions: ["webp"], mimes: ["image/webp"], label: "WEBP image", kind: "image" },
  { extensions: ["gif"], mimes: ["image/gif"], label: "GIF image", kind: "image" },
  { extensions: ["pdf"], mimes: ["application/pdf"], label: "PDF document", kind: "document" },
  {
    extensions: ["doc"],
    mimes: ["application/msword"],
    label: "Word document",
    kind: "document",
  },
  {
    extensions: ["docx"],
    mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    label: "Word document",
    kind: "document",
  },
  {
    extensions: ["xls"],
    mimes: ["application/vnd.ms-excel"],
    label: "Excel spreadsheet",
    kind: "document",
  },
  {
    extensions: ["xlsx"],
    mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    label: "Excel spreadsheet",
    kind: "document",
  },
  {
    extensions: ["ppt"],
    mimes: ["application/vnd.ms-powerpoint"],
    label: "PowerPoint presentation",
    kind: "document",
  },
  {
    extensions: ["pptx"],
    mimes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    label: "PowerPoint presentation",
    kind: "document",
  },
  { extensions: ["txt"], mimes: ["text/plain"], label: "Text document", kind: "document" },
  {
    extensions: ["csv"],
    mimes: ["text/csv", "application/csv", "text/plain"],
    label: "CSV spreadsheet",
    kind: "document",
  },
  {
    extensions: ["rtf"],
    mimes: ["application/rtf", "text/rtf"],
    label: "Rich text document",
    kind: "document",
  },
  {
    extensions: ["odt"],
    mimes: ["application/vnd.oasis.opendocument.text"],
    label: "OpenDocument text",
    kind: "document",
  },
  {
    extensions: ["ods"],
    mimes: ["application/vnd.oasis.opendocument.spreadsheet"],
    label: "OpenDocument spreadsheet",
    kind: "document",
  },
  {
    extensions: ["odp"],
    mimes: ["application/vnd.oasis.opendocument.presentation"],
    label: "OpenDocument presentation",
    kind: "document",
  },
] as const;

export const IMAGE_EXTENSIONS = new Set(
  ALLOWED_ATTACHMENT_TYPES.filter((type) => type.kind === "image").flatMap((type) =>
    type.extensions.map((extension) => `.${extension}`),
  ),
);

export const ACCEPT_ATTRIBUTE = Array.from(
  new Set(
    ALLOWED_ATTACHMENT_TYPES.flatMap((type) => [
      ...type.extensions.map((extension) => `.${extension}`),
      ...type.mimes,
    ]),
  ),
).join(",");

export const ALLOWED_EXTENSION_LABEL =
  "JPG, JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, RTF, ODT, ODS or ODP";

export const RATE_LIMIT_SHORT_WINDOW = "10 m";
export const RATE_LIMIT_SHORT_MAX = 4;
export const RATE_LIMIT_LONG_WINDOW = "1 d";
export const RATE_LIMIT_LONG_MAX = 20;
