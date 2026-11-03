import { normalizeMessage } from "@/lib/validation";
import { formatBytes, truncate } from "@/lib/utils";
import type { AttachmentMeta, EmailTemplateId } from "@/types/email";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineFormat(value: string): string {
  return value
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong style=\"font-weight:700;\">$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong style=\"font-weight:700;\">$1</strong>")
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?:;])/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, "$1<em>$2</em>");
}

/**
 * Convert the composer's small, safe formatting syntax into escaped HTML.
 * Raw user HTML is never interpreted: every line is escaped first.
 */
export function renderMessageHtml(message: string): string {
  const normalized = normalizeMessage(message);
  if (!normalized) return "";

  const lines = normalized.split("\n");
  const output: string[] = [];
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    output.push(
      `<p style="margin:0 0 18px 0;line-height:1.75;">${paragraph
        .map((line) => inlineFormat(escapeHtml(line)))
        .join("<br />")}</p>`,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    const items = listItems
      .map(
        (item) =>
          `<li style="margin:0 0 8px 0;line-height:1.7;padding-left:2px;">${inlineFormat(
            escapeHtml(item),
          )}</li>`,
      )
      .join("");
    output.push(
      `<${listType} style="margin:0 0 18px 0;padding-left:24px;line-height:1.7;">${items}</${listType}>`,
    );
    listType = null;
    listItems = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const line of lines) {
    if (line.trim() === "") {
      flushAll();
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    if (listType) flushList();
    paragraph.push(line);
  }
  flushAll();

  return output.join("");
}

export function messageToPlainText(message: string): string {
  return normalizeMessage(message)
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?:;])/g, "$1$2")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, "$1$2");
}

interface Palette {
  page: string;
  card: string;
  border: string;
  headerBorder: string;
  title: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  footerText: string;
  shadow: string;
  radius: number;
  outerRadius: number;
  badgeBg: string;
}

const PALETTES: Record<EmailTemplateId, Palette> = {
  professional: {
    page: "#f1f5f9",
    card: "#ffffff",
    border: "#e2e8f0",
    headerBorder: "#e2e8f0",
    title: "#0f172a",
    text: "#334155",
    muted: "#64748b",
    accent: "#2563eb",
    accentSoft: "#eff6ff",
    footerText: "#64748b",
    shadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
    radius: 18,
    outerRadius: 20,
    badgeBg: "#f8fafc",
  },
  minimal: {
    page: "#ffffff",
    card: "#ffffff",
    border: "#e8edf3",
    headerBorder: "#eef2f7",
    title: "#0f172a",
    text: "#334155",
    muted: "#64748b",
    accent: "#0f172a",
    accentSoft: "#f8fafc",
    footerText: "#94a3b8",
    shadow: "none",
    radius: 0,
    outerRadius: 0,
    badgeBg: "#f8fafc",
  },
  dark: {
    page: "#070d1a",
    card: "#0f1a2e",
    border: "#243247",
    headerBorder: "#243247",
    title: "#f1f5f9",
    text: "#cbd5e1",
    muted: "#94a3b8",
    accent: "#60a5fa",
    accentSoft: "#16233b",
    footerText: "#7c8ba3",
    shadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
    radius: 18,
    outerRadius: 20,
    badgeBg: "#16233b",
  },
};

function attachmentBadge(filename: string): { label: string; color: string; background: string } {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "file";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return { label: "IMG", color: "#0369a1", background: "#e0f2fe" };
  }
  if (extension === "pdf") return { label: "PDF", color: "#b91c1c", background: "#fee2e2" };
  if (["doc", "docx", "odt", "rtf", "txt"].includes(extension)) {
    return { label: "DOC", color: "#1d4ed8", background: "#dbeafe" };
  }
  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return { label: "XLS", color: "#047857", background: "#d1fae5" };
  }
  if (["ppt", "pptx", "odp"].includes(extension)) {
    return { label: "PPT", color: "#c2410c", background: "#ffedd5" };
  }
  return { label: "FILE", color: "#475569", background: "#f1f5f9" };
}

function attachmentSrc(attachment: AttachmentMeta): string | null {
  if (attachment.previewUrl) return attachment.previewUrl;
  if (attachment.contentId) return `cid:${attachment.contentId}`;
  return null;
}

function renderImageGallery(attachments: AttachmentMeta[], palette: Palette): string {
  const images = attachments.filter(
    (attachment) =>
      attachment.contentType.startsWith("image/") && attachmentSrc(attachment) !== null,
  );
  if (images.length === 0) return "";

  const cells = images
    .map((attachment) => {
      const src = attachmentSrc(attachment);
      if (!src) return "";
      return `<tr><td class="md-gallery-cell" style="padding:0 0 12px 0;">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(attachment.filename)}" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:1px solid ${palette.border};border-radius:12px;" />
      </td></tr>`;
    })
    .join("");

  return `<tr><td class="md-px" style="padding:6px 40px 2px 40px;">
    <p style="margin:0 0 10px 0;font-size:11px;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:${palette.muted};font-weight:600;">Image previews</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table>
  </td></tr>`;
}

function renderAttachments(attachments: AttachmentMeta[], palette: Palette): string {
  if (attachments.length === 0) return "";

  const rows = attachments
    .map((attachment) => {
      const badge = attachmentBadge(attachment.filename);
      return `<tr>
        <td width="44" valign="top" style="padding:10px 12px 10px 0;">
          <div style="width:40px;height:40px;border-radius:10px;background:${badge.background};color:${badge.color};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-align:center;line-height:40px;">${badge.label}</div>
        </td>
        <td valign="middle" style="padding:10px 0;">
          <p style="margin:0;font-size:14px;line-height:1.4;font-weight:600;color:${palette.title};word-break:break-word;">${escapeHtml(attachment.filename)}</p>
          <p style="margin:2px 0 0 0;font-size:12px;line-height:1.4;color:${palette.muted};">${formatBytes(attachment.size)} · Attached file</p>
        </td>
      </tr>`;
    })
    .join("");

  return `<tr><td class="md-px" style="padding:10px 40px 0 40px;">
    <div style="border-top:1px solid ${palette.headerBorder};padding-top:22px;"></div>
    <p style="margin:0 0 8px 0;font-size:11px;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:${palette.muted};font-weight:600;">Attachments · ${attachments.length}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  </td></tr>`;
}

export interface RenderEmailOptions {
  template: EmailTemplateId;
  subject: string;
  message: string;
  attachments?: AttachmentMeta[];
  senderName?: string;
  senderEmail?: string;
  appUrl?: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function renderEmail({
  template,
  subject,
  message,
  attachments = [],
  senderName = "MailDrop",
  appUrl,
}: RenderEmailOptions): RenderedEmail {
  const palette = PALETTES[template];
  const safeSubject = escapeHtml(subject);
  const plainMessage = messageToPlainText(message);
  const preheader = escapeHtml(truncate(plainMessage.replace(/\s+/g, " "), 120));
  const messageHtml = renderMessageHtml(message);
  const safeAppUrl = appUrl && /^https?:\/\//i.test(appUrl) ? appUrl.replace(/\/$/, "") : null;
  const brand = `<span style="color:${template === "dark" ? "#f8fafc" : "#172554"};">Mail</span><span style="color:${palette.accent};">Drop</span>`;
  const footerLinks = safeAppUrl
    ? `<a href="${escapeHtml(safeAppUrl)}/privacy" style="color:${palette.footerText};text-decoration:underline;">Privacy</a> &nbsp;·&nbsp; <a href="${escapeHtml(safeAppUrl)}/terms" style="color:${palette.footerText};text-decoration:underline;">Acceptable use</a>`
    : "";

  const html = `<!doctype html>
<html lang="en" ${template === "dark" ? 'style="color-scheme:dark;"' : ""}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="${template === "dark" ? "dark only" : "light only"}" />
  <title>${safeSubject}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .md-container { width: 100% !important; max-width: 100% !important; }
      .md-px { padding-left: 22px !important; padding-right: 22px !important; }
      .md-title { font-size: 23px !important; line-height: 1.3 !important; }
      .md-body { font-size: 15px !important; }
      .md-page { padding: 16px 0 !important; }
      .md-gallery-cell img { max-width: 100% !important; }
      .md-footer { padding-left: 22px !important; padding-right: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${palette.page};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${palette.page};">
    <tr>
      <td class="md-page" align="center" style="padding:36px 12px;">
        <table role="presentation" class="md-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
          <tr>
            <td style="padding:0 6px 16px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="32" valign="middle" style="padding-right:10px;">
                          <div style="width:30px;height:30px;border-radius:9px;background:${palette.accent};color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;text-align:center;line-height:30px;">M</div>
                        </td>
                        <td valign="middle" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:19px;font-weight:700;letter-spacing:-0.02em;">${brand}</td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${palette.muted};">Private message</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:${palette.card};border:1px solid ${palette.border};border-radius:${palette.outerRadius}px;box-shadow:${palette.shadow};overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="md-px" style="padding:34px 40px 26px 40px;border-bottom:1px solid ${palette.headerBorder};">
                    <p style="margin:0 0 10px 0;font-size:10px;line-height:1.4;letter-spacing:0.16em;text-transform:uppercase;color:${palette.accent};font-weight:700;">A message for you</p>
                    <h1 class="md-title" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:27px;line-height:1.32;font-weight:700;letter-spacing:-0.025em;color:${palette.title};">${safeSubject}</h1>
                  </td>
                </tr>
                ${renderImageGallery(attachments, palette)}
                <tr>
                  <td class="md-px md-body" style="padding:${attachments.length > 0 ? "24px" : "30px"} 40px 8px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.75;color:${palette.text};">
                    ${messageHtml}
                  </td>
                </tr>
                ${renderAttachments(attachments, palette)}
                <tr><td style="padding:0 40px;"><div style="height:28px;line-height:28px;font-size:28px;">&nbsp;</div></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="md-footer" style="padding:22px 18px 6px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 6px 0;font-size:12px;line-height:1.6;color:${palette.footerText};text-align:center;">
                Sent with <strong style="color:${palette.muted};">MailDrop</strong>${senderName ? ` · Composed by ${escapeHtml(senderName)}` : ""}
              </p>
              <p style="margin:0 0 8px 0;font-size:11px;line-height:1.6;color:${palette.footerText};text-align:center;">
                Delivered securely through Resend. MailDrop does not store message content or attachments after sending.
              </p>
              ${footerLinks ? `<p style="margin:0;font-size:11px;line-height:1.6;color:${palette.footerText};text-align:center;">${footerLinks}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0 0 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;line-height:1.6;color:${palette.footerText};">
              You received this message because someone submitted your address through MailDrop.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const attachmentText =
    attachments.length > 0
      ? `\n\nAttachments:\n${attachments
          .map((attachment) => `- ${attachment.filename} (${formatBytes(attachment.size)})`)
          .join("\n")}`
      : "";

  const text = `${plainMessage}${attachmentText}\n\n--\nSent with MailDrop${senderName ? ` · Composed by ${senderName}` : ""}\nDelivered securely through Resend. MailDrop does not store message content or attachments after sending.`;

  return { html, text };
}
