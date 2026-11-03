"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  LockKeyhole,
  Mail,
  Monitor,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { renderEmail } from "@/lib/email-templates";
import { EMAIL_TEMPLATES, type ComposerConfig, type EmailTemplateId, type LocalAttachment } from "@/types/email";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface EmailPreviewProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  config: ComposerConfig;
  recipients: string[];
  subject: string;
  message: string;
  template: EmailTemplateId;
  attachments: LocalAttachment[];
}

export function EmailPreview({
  open,
  onClose,
  onEdit,
  config,
  recipients,
  subject,
  message,
  template,
  attachments,
}: EmailPreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const previewHtml = useMemo(() => {
    if (!open) return "";
    return renderEmail({
      template,
      subject: subject || "Your subject will appear here",
      message: message || "Your message preview will appear here.",
      attachments: attachments.map((attachment) => ({
        filename: attachment.file.name,
        size: attachment.file.size,
        contentType: attachment.file.type || "application/octet-stream",
        ...(attachment.previewUrl ? { previewUrl: attachment.previewUrl } : {}),
      })),
      senderName: config.fromName === "MailDrop" ? "" : config.fromName,
      appUrl: config.appUrl,
    }).html;
  }, [open, template, subject, message, attachments, config.fromName, config.appUrl]);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 60);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open, onClose]);

  const templateName =
    EMAIL_TEMPLATES.find((item) => item.id === template)?.name ?? "Modern Professional";
  const recipientLabel =
    recipients.length <= 3
      ? recipients.join(", ")
      : `${recipients.slice(0, 2).join(", ")} +${recipients.length - 2} more`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#0b1533]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
            className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-float sm:max-h-[calc(100dvh-3rem)]"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Eye className="size-4" />
                </span>
                <div>
                  <h2 id="preview-title" className="text-[14px] font-semibold text-navy">
                    Email preview
                  </h2>
                  <p className="text-[10.5px] text-slate-400">This is what your recipients will see.</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:flex">
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    aria-pressed={viewport === "desktop"}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[10.5px] font-semibold transition-colors",
                      viewport === "desktop"
                        ? "bg-white text-navy shadow-sm"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <Monitor className="size-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport("mobile")}
                    aria-pressed={viewport === "mobile"}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[10.5px] font-semibold transition-colors",
                      viewport === "mobile"
                        ? "bg-white text-navy shadow-sm"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <Smartphone className="size-3.5" />
                    Mobile
                  </button>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="grid size-9 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy"
                  aria-label="Close preview"
                >
                  <X className="size-4.5" />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
              <dl className="grid gap-x-6 gap-y-2 text-[11.5px] sm:grid-cols-2">
                <div className="flex min-w-0 items-start gap-2">
                  <dt className="flex w-14 shrink-0 items-center gap-1 text-slate-400">
                    <LockKeyhole className="size-3" />
                    From
                  </dt>
                  <dd className="truncate font-medium text-slate-700">
                    {config.fromName} &lt;{config.fromEmail}&gt;
                  </dd>
                </div>
                <div className="flex min-w-0 items-start gap-2">
                  <dt className="w-14 shrink-0 text-slate-400">To</dt>
                  <dd className="truncate font-medium text-slate-700" title={recipients.join(", ")}>
                    {recipientLabel || "Add recipients to preview"}
                  </dd>
                </div>
                <div className="flex min-w-0 items-start gap-2 sm:col-span-2">
                  <dt className="w-14 shrink-0 text-slate-400">Subject</dt>
                  <dd className="truncate font-medium text-slate-700">
                    {subject || "Add a subject to preview"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100/80 p-3 sm:p-5">
              <div
                className={cn(
                  "mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[max-width] duration-300",
                  viewport === "mobile" ? "max-w-[390px]" : "max-w-full",
                )}
              >
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className="h-[52vh] min-h-[360px] w-full bg-white sm:h-[58vh]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium">
                  <Mail className="size-3" />
                  {templateName}
                </span>
                <span>{attachments.length} attachment{attachments.length === 1 ? "" : "s"}</span>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <span className="hidden sm:inline">Preview only — delivery is not confirmed here.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onEdit} className="flex-1 sm:flex-none">
                  <ArrowLeft className="size-3.5" />
                  Edit Email
                </Button>
                <Button size="sm" onClick={onClose} className="flex-1 sm:flex-none">
                  Looks good
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
