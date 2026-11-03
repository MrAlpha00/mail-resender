"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  Info,
  LockKeyhole,
  Mail,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { AttachmentUpload } from "@/components/email/AttachmentUpload";
import { EmailPreview } from "@/components/email/EmailPreview";
import { MessageEditor } from "@/components/email/MessageEditor";
import { RecipientInput } from "@/components/email/RecipientInput";
import { SendButton } from "@/components/email/SendButton";
import { SuccessScreen } from "@/components/email/SuccessScreen";
import { TemplateSelector } from "@/components/email/TemplateSelector";
import { Button } from "@/components/ui/Button";
import { validateAttachment, isImageFilename } from "@/lib/attachments";
import {
  MAX_FILE_COUNT,
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
} from "@/lib/constants";
import { composerTextSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type {
  ComposerConfig,
  ComposerTextValues,
  EmailTemplateId,
  LocalAttachment,
  SendEmailResponse,
  SendEmailSuccessResponse,
} from "@/types/email";

interface ComposerFormProps {
  config: ComposerConfig;
}

interface SendRequestResult {
  status: number;
  data: SendEmailResponse | null;
}

function isSendResponse(value: unknown): value is SendEmailResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.ok === "boolean" && typeof record.requestId === "string";
}

function postEmail(formData: FormData, onProgress: (value: number) => void): Promise<SendRequestResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/send-email");
    xhr.timeout = 120_000;
    xhr.setRequestHeader("Accept", "application/json");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total === 0) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.upload.onload = () => onProgress(100);

    const finish = (status: number, data: SendEmailResponse | null) => {
      resolve({ status, data });
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText) as unknown;
        finish(xhr.status, isSendResponse(parsed) ? parsed : null);
      } catch {
        finish(xhr.status, null);
      }
    };
    xhr.onerror = () => finish(0, null);
    xhr.ontimeout = () => finish(0, null);
    xhr.onabort = () => finish(0, null);

    xhr.send(formData);
  });
}

function ReadinessRow({
  done,
  warning,
  label,
  detail,
}: {
  done: boolean;
  warning?: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      {warning ? (
        <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
      ) : done ? (
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
      ) : (
        <Circle className="mt-0.5 size-3.5 shrink-0 text-slate-300" />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "text-[11.5px] font-medium",
            warning ? "text-amber-700" : done ? "text-slate-700" : "text-slate-400",
          )}
        >
          {label}
        </p>
        {detail && <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{detail}</p>}
      </div>
    </li>
  );
}

export function ComposerForm({ config }: ComposerFormProps) {
  const form = useForm<ComposerTextValues>({
    resolver: zodResolver(composerTextSchema),
    defaultValues: { subject: "", message: "" },
    mode: "onTouched",
  });

  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientError, setRecipientError] = useState<string | undefined>();
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [template, setTemplate] = useState<EmailTemplateId>("professional");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sending" | "results">("idle");
  const [result, setResult] = useState<SendEmailSuccessResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());

  const submittingRef = useRef(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const composerTopRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const subjectValue = useWatch({ control: form.control, name: "subject" }) ?? "";
  const messageValue = useWatch({ control: form.control, name: "message" }) ?? "";
  const isSending = sendState === "sending";

  const subjectValid = subjectValue.trim().length > 0 && subjectValue.length <= MAX_SUBJECT_LENGTH;
  const messageValid = messageValue.trim().length > 0 && messageValue.length <= MAX_MESSAGE_LENGTH;
  const recipientsValid = recipients.length > 0 && recipients.length <= config.maxRecipients;
  const readyToSend =
    recipientsValid && subjectValid && messageValid && config.deliveryConfigured;
  const totalAttachmentBytes = attachments.reduce((sum, item) => sum + item.file.size, 0);
  const readinessComplete = [recipientsValid, subjectValid && messageValid, config.deliveryConfigured]
    .filter(Boolean).length;

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (sendState === "results") {
      composerTopRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [sendState, reduceMotion]);

  useEffect(() => {
    if (formError) {
      errorRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  }, [formError, reduceMotion]);

  const revokePreview = (url: string | null) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  };

  const handleRecipientsChange = (nextRecipients: string[]) => {
    setRecipients(nextRecipients);
    setRecipientError(undefined);
  };

  const handleFilesSelected = (files: File[]) => {
    const accepted: LocalAttachment[] = [];
    const errors: string[] = [];
    let count = attachments.length;
    let totalBytes = totalAttachmentBytes;

    for (const file of files) {
      const validation = validateAttachment(file, {
        existingCount: count,
        existingBytes: totalBytes,
      });

      if (!validation.ok) {
        if (validation.error) errors.push(validation.error);
        continue;
      }

      const isImage = validation.spec?.kind === "image" || isImageFilename(file.name);
      let previewUrl: string | null = null;
      if (isImage) {
        previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
      }

      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        isImage,
      });
      count += 1;
      totalBytes += file.size;
    }

    if (accepted.length > 0) {
      setAttachments((current) => [...current, ...accepted]);
    }

    const uniqueErrors = [...new Set(errors)];
    setAttachmentError(uniqueErrors.length > 0 ? uniqueErrors.slice(0, 3).join(" ") : null);
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const target = current.find((item) => item.id === id);
      revokePreview(target?.previewUrl ?? null);
      return current.filter((item) => item.id !== id);
    });
    setAttachmentError(null);
  };

  const clearAttachments = useCallback(() => {
    setAttachments((current) => {
      for (const item of current) revokePreview(item.previewUrl);
      return [];
    });
    setAttachmentError(null);
  }, []);

  const showFormError = (message: string) => {
    setFormError(message);
  };

  const validateBeforeAction = async (): Promise<boolean> => {
    const textValid = await form.trigger();
    let valid = textValid;

    if (recipients.length === 0) {
      setRecipientError("Add at least one recipient before sending.");
      valid = false;
    } else if (recipients.length > config.maxRecipients) {
      setRecipientError(`You can send to up to ${config.maxRecipients} recipients.`);
      valid = false;
    }

    if (!valid) {
      showFormError("A few details still need your attention. Check the highlighted fields.");
    }
    return valid;
  };

  const handlePreview = async () => {
    setFormError(null);
    const valid = await validateBeforeAction();
    if (!valid) return;
    setPreviewOpen(true);
  };

  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const editFromPreview = useCallback(() => {
    setPreviewOpen(false);
    requestAnimationFrame(() => {
      document.getElementById("subject")?.focus();
    });
  }, []);

  const applyFieldErrors = (fieldErrors: Record<string, string[]> | undefined) => {
    if (!fieldErrors) return;
    if (fieldErrors.recipients?.[0]) setRecipientError(fieldErrors.recipients[0]);
    if (fieldErrors.subject?.[0]) {
      form.setError("subject", { type: "server", message: fieldErrors.subject[0] });
    }
    if (fieldErrors.message?.[0]) {
      form.setError("message", { type: "server", message: fieldErrors.message[0] });
    }
  };

  const performSend = async (values: ComposerTextValues) => {
    // Set the guard before any await so a rapid double-click cannot start two
    // submissions.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setFormError(null);
    let attempted = false;

    try {
      const valid = await validateBeforeAction();
      if (!valid) return;

      if (!config.deliveryConfigured) {
        showFormError(
          "Email delivery is not configured. Add RESEND_API_KEY to the environment and redeploy.",
        );
        return;
      }

      attempted = true;
      setSendState("sending");
      setUploadProgress(0);

      const body = new FormData();
      body.append("recipients", JSON.stringify(recipients));
      body.append("subject", values.subject);
      body.append("message", values.message);
      body.append("selectedTemplate", template);
      body.append("submissionId", submissionId);
      for (const attachment of attachments) {
        body.append("attachments", attachment.file, attachment.file.name);
      }

      const response = await postEmail(body, setUploadProgress);

      if (!response.data) {
        setSendState("idle");
        showFormError(
          response.status === 413
            ? "The upload is too large for the server. Remove an attachment or choose a smaller file."
            : response.status === 0
              ? "MailDrop could not reach the server, so delivery was not confirmed. Check your connection and try again."
              : "The server returned an unexpected response. Delivery was not confirmed.",
        );
        return;
      }

      if (response.data.ok) {
        setResult(response.data);
        setSendState("results");
        setPreviewOpen(false);
        return;
      }

      applyFieldErrors(response.data.fieldErrors);
      setSendState("idle");

      let message = response.data.message;
      if (response.data.code === "rate_limited" && response.data.retryAfter) {
        const seconds = response.data.retryAfter;
        const wait =
          seconds >= 120
            ? `${Math.ceil(seconds / 60)} minutes`
            : `${seconds} second${seconds === 1 ? "" : "s"}`;
        message = `${message} Try again in about ${wait}.`;
      }
      showFormError(message);
    } catch {
      setSendState("idle");
      showFormError(
        "Something unexpected happened while submitting. Delivery was not confirmed. Check the Resend dashboard before retrying.",
      );
    } finally {
      submittingRef.current = false;
      if (attempted) {
        setUploadProgress(0);
      }
    }
  };

  const submitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Build the handler inside the submit event so React Hook Form never
    // receives a ref-reading callback during render.
    void form.handleSubmit(performSend, () => {
      showFormError("Check the highlighted fields before sending.");
    })(event);
  };

  const resetComposer = () => {
    form.reset({ subject: "", message: "" });
    setRecipients([]);
    clearAttachments();
    setTemplate("professional");
    setPreviewOpen(false);
    setResult(null);
    setSendState("idle");
    setFormError(null);
    setRecipientError(undefined);
    setAttachmentError(null);
    setUploadProgress(0);
    setSubmissionId(crypto.randomUUID());
    requestAnimationFrame(() => {
      composerTopRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const retryFailed = () => {
    if (!result) return;
    const failedRecipients = result.results
      .filter((item) => item.status === "failed")
      .map((item) => item.recipient);
    setRecipients(failedRecipients);
    setRecipientError(undefined);
    setResult(null);
    setSendState("idle");
    setFormError(null);
    setAttachmentError(null);
    setSubmissionId(crypto.randomUUID());
    requestAnimationFrame(() => {
      composerTopRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  if (sendState === "results" && result) {
    return (
      <div ref={composerTopRef} className="container-shell scroll-mt-24 pb-20 pt-8 sm:pt-10">
        <SuccessScreen result={result} onReset={resetComposer} onRetryFailed={retryFailed} />
      </div>
    );
  }

  return (
    <div ref={composerTopRef} className="container-shell scroll-mt-24 pb-20 pt-6 sm:pt-8">
      {!config.deliveryConfigured && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Email delivery is not configured in this environment.</p>
            <p className="mt-0.5 text-amber-800/90">
              You can compose and preview, but the send button stays disabled until{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5 text-[10.5px]">RESEND_API_KEY</code>{" "}
              is set.
            </p>
          </div>
        </div>
      )}

      {config.resendTestMode && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12px] leading-5 text-sky-900">
          <Info className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Resend test mode is active.</p>
            <p className="mt-0.5 text-sky-800/90">
              Resend currently accepts only the email address associated with its account. Other
              recipients will be rejected until a custom sending domain is verified.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_348px] lg:items-start">
        <form
          id="compose-form"
          noValidate
          onSubmit={submitHandler}
          aria-busy={isSending}
          className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-card"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-navy text-white">
                <Mail className="size-4" />
              </span>
              <div>
                <h2 className="text-[13px] font-semibold text-navy">New email</h2>
                <p className="text-[10.5px] text-slate-400">Private individual delivery</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9.5px] font-semibold text-emerald-700">
              <ShieldCheck className="size-3" />
              Addresses hidden
            </span>
          </div>

          <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
            <RecipientInput
              recipients={recipients}
              onChange={handleRecipientsChange}
              maxRecipients={config.maxRecipients}
              error={recipientError}
              disabled={isSending}
            />

            <div className="border-t border-slate-100 pt-6">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="subject" className="text-[13px] font-semibold text-navy">
                  Subject
                </label>
                <span
                  className={cn(
                    "text-[10.5px] tabular-nums",
                    subjectValue.length > MAX_SUBJECT_LENGTH * 0.9
                      ? "text-amber-600"
                      : "text-slate-400",
                  )}
                >
                  {subjectValue.length} / {MAX_SUBJECT_LENGTH}
                </span>
              </div>
              <input
                id="subject"
                type="text"
                placeholder="Enter your email subject"
                maxLength={MAX_SUBJECT_LENGTH}
                disabled={isSending}
                aria-invalid={Boolean(form.formState.errors.subject)}
                aria-describedby={form.formState.errors.subject ? "subject-error" : undefined}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                }}
                className={cn(
                  "h-11 w-full rounded-xl border bg-white px-3.5 text-[13.5px] text-ink shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition-all duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70",
                  form.formState.errors.subject
                    ? "border-red-300 ring-4 ring-red-500/5"
                    : "border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10",
                )}
                {...form.register("subject")}
              />
              {form.formState.errors.subject && (
                <p id="subject-error" role="alert" className="mt-1.5 text-[11.5px] font-medium text-red-600">
                  {form.formState.errors.subject.message}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <MessageEditor
                control={form.control}
                disabled={isSending}
                onDirty={() => {
                  if (formError) setFormError(null);
                }}
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <AttachmentUpload
                attachments={attachments}
                onFilesSelected={handleFilesSelected}
                onRemove={removeAttachment}
                onClear={clearAttachments}
                error={attachmentError}
                disabled={isSending}
                isSending={isSending}
                uploadProgress={uploadProgress}
              />
            </div>

            <AnimatePresence>
              {formError && (
                <motion.div
                  ref={errorRef}
                  role="alert"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[11.5px] leading-5 text-red-800">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-slate-100 pt-5">
              <Button
                variant="secondary"
                size="lg"
                onClick={handlePreview}
                disabled={isSending}
                className="w-full"
              >
                <Eye className="size-4.5" />
                Preview Email
              </Button>
              <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                Previewing never sends your email or uploads your files.
              </p>
            </div>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1 lg:no-scrollbar">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-semibold text-navy">Delivery settings</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700">
                  <LockKeyhole className="size-2.5" />
                  Fixed sender
                </span>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-sm">
                  <Mail className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    From
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] font-medium text-slate-700">
                    {config.fromName} &lt;{config.fromEmail}&gt;
                  </p>
                  <p className="mt-0.5 text-[9.5px] text-slate-400">
                    Set by MailDrop · cannot be changed
                  </p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                    <Info className="size-2.5" />
                    Resend Test Mode
                  </span>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 px-5 py-4">
              <TemplateSelector value={template} onChange={setTemplate} disabled={isSending} />
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-semibold text-navy">Ready to send</h2>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-400">
                  <Sparkles className="size-3" />
                  {Math.round((readinessComplete / 3) * 100)}%
                </span>
              </div>

              <ul className="mt-3 space-y-2.5">
                <ReadinessRow
                  done={recipientsValid}
                  label="Recipients added"
                  detail={
                    recipients.length > 0
                      ? `${recipients.length} of ${config.maxRecipients} · individual copies`
                      : "At least one address required"
                  }
                />
                <ReadinessRow
                  done={subjectValid && messageValid}
                  label="Subject and message"
                  detail={subjectValid && messageValid ? "Ready to format" : "Both are required"}
                />
                <ReadinessRow
                  done={config.deliveryConfigured}
                  warning={!config.deliveryConfigured}
                  label="Delivery configured"
                  detail={config.deliveryConfigured ? "Resend API key ready" : "RESEND_API_KEY missing"}
                />
                <ReadinessRow
                  done
                  label="Attachments"
                  detail={
                    attachments.length > 0
                      ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} · ${(totalAttachmentBytes / 1024 / 1024).toFixed(1)} MB`
                      : `Optional · up to ${MAX_FILE_COUNT} files`
                  }
                />
              </ul>

              <div className="mt-4">
                <SendButton
                  formId="compose-form"
                  disabled={!readyToSend}
                  isSending={isSending}
                  uploadProgress={uploadProgress}
                />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-[10px] leading-4 text-slate-500">
                <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                <span>
                  Your message content and files are not stored by MailDrop. The provider and
                  infrastructure process delivery metadata.
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Users className="size-3.5 text-blue-500" />
              <span className="font-medium text-slate-600">Private by default</span>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              Every recipient receives a separate copy. No To, Cc, or Bcc list is shared.
            </p>
            {attachments.length > 0 && (
              <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-slate-400">
                <Paperclip className="size-3" />
                {attachments.length} attached file{attachments.length === 1 ? "" : "s"} ready
              </p>
            )}
            {attachments.length === 0 && (
              <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-slate-400">
                <Check className="size-3 text-emerald-500" />
                No files attached
              </p>
            )}
          </div>
        </aside>
      </div>

      <EmailPreview
        open={previewOpen}
        onClose={closePreview}
        onEdit={editFromPreview}
        config={config}
        recipients={recipients}
        subject={subjectValue}
        message={messageValue}
        template={template}
        attachments={attachments}
      />
    </div>
  );
}
