"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AtSign, Plus, ShieldCheck, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { splitRecipientText, isValidEmail, normalizeEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface RecipientInputProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  maxRecipients: number;
  error?: string;
  disabled?: boolean;
}

export function RecipientInput({
  recipients,
  onChange,
  maxRecipients,
  error,
  disabled = false,
}: RecipientInputProps) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const inputId = useId();
  const errorId = useId();
  const helpId = useId();

  const addRecipients = (rawValues: string[]) => {
    const existing = new Set(recipients);
    const next = [...recipients];
    let invalid = 0;
    let duplicate = 0;
    let overflow = 0;

    for (const rawValue of rawValues) {
      const normalized = normalizeEmail(rawValue);
      if (!normalized) continue;

      if (!isValidEmail(normalized)) {
        invalid += 1;
        continue;
      }
      if (existing.has(normalized) || next.includes(normalized)) {
        duplicate += 1;
        continue;
      }
      if (next.length >= maxRecipients) {
        overflow += 1;
        continue;
      }
      next.push(normalized);
      existing.add(normalized);
    }

    if (next.length !== recipients.length) onChange(next);

    const messages: string[] = [];
    if (invalid > 0) {
      messages.push(`${invalid} invalid address${invalid > 1 ? "es were" : " was"} skipped.`);
    }
    if (duplicate > 0) {
      messages.push(`${duplicate} duplicate address${duplicate > 1 ? "es were" : " was"} ignored.`);
    }
    if (overflow > 0) {
      messages.push(`The limit is ${maxRecipients} recipients per email.`);
    }
    setLocalError(messages.length > 0 ? messages.join(" ") : null);
  };

  const commitValue = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    addRecipients(splitRecipientText(trimmed));
    setValue("");
  };

  const removeRecipient = (recipient: string) => {
    onChange(recipients.filter((item) => item !== recipient));
    setLocalError(null);
  };

  const clearAll = () => {
    onChange([]);
    setLocalError(null);
    setValue("");
    inputRef.current?.focus();
  };

  const message = localError ?? error;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ");

  return (
    <section aria-labelledby={`${inputId}-heading`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label
            id={`${inputId}-heading`}
            htmlFor={inputId}
            className="text-[13px] font-semibold text-navy"
          >
            Recipients
          </label>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-slate-500">
            {recipients.length} / {maxRecipients}
          </span>
        </div>
        {recipients.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            Clear all
          </button>
        )}
      </div>

      <div
        className={cn(
          "rounded-2xl border bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200",
          message
            ? "border-red-300 ring-4 ring-red-500/5"
            : "border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10",
          disabled && "bg-slate-50 opacity-70",
        )}
        onClick={() => inputRef.current?.focus()}
        role="group"
        aria-label="Recipient email addresses"
      >
        {recipients.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Added recipients">
            <AnimatePresence initial={false}>
              {recipients.map((recipient) => (
                <motion.li
                  key={recipient}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.16 }}
                  className="inline-flex max-w-full items-center gap-1 rounded-lg border border-blue-100 bg-blue-50/80 py-1 pl-2 pr-1 text-[12px] font-medium text-blue-800"
                >
                  <span className="max-w-[190px] truncate sm:max-w-[260px]">{recipient}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeRecipient(recipient);
                    }}
                    disabled={disabled}
                    className="grid size-5 shrink-0 place-items-center rounded-md text-blue-500/80 transition-colors hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                    aria-label={`Remove ${recipient}`}
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <div className="flex items-center gap-2 px-0.5">
          <AtSign className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              setValue(event.target.value);
              if (localError) setLocalError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "," || event.key === ";") {
                event.preventDefault();
                commitValue();
              } else if (event.key === "Backspace" && value.length === 0 && recipients.length > 0) {
                removeRecipient(recipients[recipients.length - 1]);
              }
            }}
            onBlur={() => {
              if (value.trim()) commitValue();
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (!text.includes(",") && !text.includes(";") && !/[\r\n]/.test(text)) {
                return;
              }
              event.preventDefault();
              addRecipients(splitRecipientText(text));
              setValue("");
            }}
            placeholder={
              recipients.length === 0
                ? "name@example.com"
                : "Add another recipient"
            }
            aria-invalid={Boolean(message)}
            aria-describedby={describedBy}
            className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />
          {value.trim() && (
            <button
              type="button"
              onClick={commitValue}
              disabled={disabled}
              className="grid size-7 shrink-0 place-items-center rounded-lg bg-navy text-white transition-colors hover:bg-[#1e3a8a] disabled:opacity-50"
              aria-label="Add recipient"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
        <span id={helpId}>
          Press Enter or comma to add. Paste a list separated by commas, semicolons, or new
          lines. Everyone receives a separate, private copy.
        </span>
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            id={errorId}
            role="alert"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            className="mt-1.5 overflow-hidden text-[11.5px] font-medium text-red-600"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
