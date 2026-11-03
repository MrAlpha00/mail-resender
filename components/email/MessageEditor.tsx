"use client";

import { AlignLeft, Bold, Italic, List } from "lucide-react";
import { useRef } from "react";
import { useController, type Control } from "react-hook-form";

import { MAX_MESSAGE_LENGTH } from "@/lib/constants";
import type { ComposerTextValues } from "@/types/email";
import { cn } from "@/lib/utils";

interface MessageEditorProps {
  control: Control<ComposerTextValues>;
  disabled?: boolean;
  onDirty?: () => void;
}

export function MessageEditor({ control, disabled = false, onDirty }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    field,
    fieldState: { error },
  } = useController({ control, name: "message" });

  const value = field.value ?? "";

  const applyWrap = (before: string, after: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    field.onChange(next);
    onDirty?.();
    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      textarea.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  };

  const toggleList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const allListed = lines.every((line) => line.trim() === "" || /^\s*[-*]\s+/.test(line));
    const nextBlock = lines
      .map((line) => {
        if (!line.trim()) return line;
        if (allListed) return line.replace(/^\s*[-*]\s+/, "");
        return `- ${line.replace(/^\s*[-*]\s+/, "")}`;
      })
      .join("\n");
    const next = `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`;
    field.onChange(next);
    onDirty?.();
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + nextBlock.length);
    });
  };

  const remaining = MAX_MESSAGE_LENGTH - value.length;
  const nearLimit = remaining <= 500;

  return (
    <section aria-labelledby="message-label">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label id="message-label" htmlFor="message" className="text-[13px] font-semibold text-navy">
          Message
        </label>
        <span
          className={cn(
            "text-[10.5px] font-medium tabular-nums",
            nearLimit ? "text-amber-600" : "text-slate-400",
          )}
        >
          {value.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
        </span>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200",
          error
            ? "border-red-300 ring-4 ring-red-500/5"
            : "border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10",
          disabled && "bg-slate-50 opacity-70",
        )}
      >
        <div className="flex items-center gap-0.5 border-b border-slate-100 bg-slate-50/60 px-2 py-1.5">
          <button
            type="button"
            onClick={() => applyWrap("**", "**", "bold text")}
            disabled={disabled}
            className="grid size-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-navy hover:shadow-sm disabled:opacity-40"
            aria-label="Bold"
            title="Bold (Ctrl/Cmd + B)"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyWrap("_", "_", "italic text")}
            disabled={disabled}
            className="grid size-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-navy hover:shadow-sm disabled:opacity-40"
            aria-label="Italic"
            title="Italic (Ctrl/Cmd + I)"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleList}
            disabled={disabled}
            className="grid size-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-navy hover:shadow-sm disabled:opacity-40"
            aria-label="Bulleted list"
            title="Bulleted list"
          >
            <List className="size-4" />
          </button>
          <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 px-1.5 text-[10px] font-medium text-slate-400">
            <AlignLeft className="size-3" />
            Line breaks preserved
          </span>
        </div>

        <textarea
          ref={(node) => {
            textareaRef.current = node;
            field.ref(node);
          }}
          id="message"
          name={field.name}
          value={value}
          onChange={(event) => {
            field.onChange(event);
            onDirty?.();
          }}
          onBlur={field.onBlur}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
              event.preventDefault();
              applyWrap("**", "**", "bold text");
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
              event.preventDefault();
              applyWrap("_", "_", "italic text");
            }
          }}
          disabled={disabled}
          rows={12}
          placeholder="Write your message here..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "message-error" : "message-help"}
          className="block min-h-[250px] w-full resize-y bg-transparent px-4 py-3.5 text-[14px] leading-7 text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:min-h-[290px]"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-2 text-[11px] leading-5 text-slate-500">
        <p id="message-help" className="max-w-xl">
          Use **bold**, _italic_, and - lists. Formatting is converted to safe HTML and
          every line break is preserved.
        </p>
        <p className="text-slate-400">No personal details required</p>
      </div>

      {error && (
        <p id="message-error" role="alert" className="mt-1.5 text-[11.5px] font-medium text-red-600">
          {error.message}
        </p>
      )}
    </section>
  );
}
