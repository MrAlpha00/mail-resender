"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CloudUpload,
  File,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Loader2,
  Presentation,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_EXTENSION_LABEL,
  MAX_FILE_COUNT,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_ATTACHMENT_BYTES,
} from "@/lib/constants";
import { getExtension } from "@/lib/attachments";
import { formatBytes } from "@/lib/utils";
import type { LocalAttachment } from "@/types/email";
import { cn } from "@/lib/utils";

interface AttachmentUploadProps {
  attachments: LocalAttachment[];
  onFilesSelected: (files: File[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  error?: string | null;
  disabled?: boolean;
  isSending?: boolean;
  uploadProgress?: number;
}

function FileGlyph({ filename }: { filename: string }) {
  const extension = getExtension(filename);
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return <ImageIcon className="size-4" />;
  }
  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return <FileSpreadsheet className="size-4" />;
  }
  if (["ppt", "pptx", "odp"].includes(extension)) {
    return <Presentation className="size-4" />;
  }
  if (["pdf", "doc", "docx", "rtf", "txt", "odt"].includes(extension)) {
    return <FileText className="size-4" />;
  }
  return <File className="size-4" />;
}

export function AttachmentUpload({
  attachments,
  onFilesSelected,
  onRemove,
  onClear,
  error,
  disabled = false,
  isSending = false,
  uploadProgress = 0,
}: AttachmentUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const reduceMotion = useReducedMotion();
  const totalBytes = attachments.reduce((sum, attachment) => sum + attachment.file.size, 0);
  const atLimit = attachments.length >= MAX_FILE_COUNT;

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <section aria-labelledby="attachments-label">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label id="attachments-label" className="text-[13px] font-semibold text-navy">
            Attachments
          </label>
          <span className="text-[10.5px] font-medium text-slate-400">Optional</span>
          {attachments.length > 0 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-slate-500">
              {attachments.length} / {MAX_FILE_COUNT} · {formatBytes(totalBytes)}
            </span>
          )}
        </div>
        {attachments.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled || isSending}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="size-3" />
            Remove all
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        aria-hidden="true"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFilesSelected(files);
          event.target.value = "";
        }}
      />

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (disabled) return;
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (disabled) return;
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (disabled) return;
          const files = Array.from(event.dataTransfer.files ?? []);
          if (files.length > 0) onFilesSelected(files);
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-all duration-200 sm:px-6",
          dragging
            ? "border-blue-400 bg-blue-50/70 ring-4 ring-blue-500/10"
            : error
              ? "border-red-300 bg-red-50/30"
              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        )}
        <div className="relative flex flex-col items-center">
          <span
            className={cn(
              "grid size-11 place-items-center rounded-xl transition-colors",
              dragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500",
            )}
          >
            <CloudUpload className="size-5" />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-navy">
            {dragging ? "Drop to attach" : "Drag & drop your files"}
          </p>
          <p className="mt-1 text-[11.5px] text-slate-500">
            or{" "}
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled || atLimit}
              className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-800 disabled:opacity-50"
            >
              browse your device
            </button>
          </p>
          <p className="mt-2.5 max-w-md text-[10.5px] leading-5 text-slate-400">
            {ALLOWED_EXTENSION_LABEL} · up to {MAX_FILE_COUNT} files ·{" "}
            {formatBytes(MAX_FILE_SIZE_BYTES)} each · {formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)}{" "}
            total
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[11.5px] font-medium leading-5 text-red-600">
          {error}
        </p>
      )}

      {isSending && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-3">
          <div className="mb-1.5 flex items-center justify-between text-[10.5px] font-medium text-blue-800">
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              {uploadProgress >= 100 ? "Submitting to the email provider…" : "Uploading attachments securely…"}
            </span>
            <span className="tabular-nums">{uploadProgress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-blue-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadProgress}
            aria-label="Upload progress"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              animate={{ width: `${Math.max(4, uploadProgress)}%` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {attachments.length} file{attachments.length === 1 ? "" : "s"} attached.
      </div>

      <ul className="mt-2.5 space-y-2">
        <AnimatePresence initial={false}>
          {attachments.map((attachment) => (
            <motion.li
              key={attachment.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-500">
                {attachment.isImage && attachment.previewUrl ? (
                  <Image
                    src={attachment.previewUrl}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className="size-9 object-cover"
                  />
                ) : (
                  <FileGlyph filename={attachment.file.name} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-slate-800">
                  {attachment.file.name}
                </p>
                <p className="mt-0.5 text-[10.5px] text-slate-400">
                  {formatBytes(attachment.file.size)}
                  {attachment.isImage ? " · image preview available" : " · document"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                disabled={disabled || isSending}
                className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`Remove ${attachment.file.name}`}
              >
                <X className="size-4" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
