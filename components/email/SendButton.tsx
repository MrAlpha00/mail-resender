"use client";

import { motion } from "framer-motion";
import { Loader2, LockKeyhole, Send } from "lucide-react";

import { cn } from "@/lib/utils";

interface SendButtonProps {
  disabled?: boolean;
  isSending?: boolean;
  uploadProgress?: number;
  label?: string;
}

export function SendButton({
  disabled = false,
  isSending = false,
  uploadProgress = 0,
  label = "Send Email",
}: SendButtonProps) {
  return (
    <div>
      <button
        type="submit"
        disabled={disabled || isSending}
        className={cn(
          "group relative inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-navy px-6 text-[14px] font-semibold text-white shadow-[0_14px_30px_-16px_rgba(23,37,84,0.9)] transition-all duration-200",
          "hover:bg-[#1e3a8a] hover:shadow-[0_18px_36px_-18px_rgba(23,37,84,0.85)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-navy",
        )}
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />
        {isSending ? (
          <>
            <Loader2 className="size-4.5 animate-spin" />
            <span>
              {uploadProgress >= 100 ? "Submitting your email…" : "Uploading securely…"}
            </span>
          </>
        ) : (
          <>
            <Send className="size-4.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            <span>{label}</span>
          </>
        )}
        {isSending && (
          <motion.span
            className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-blue-400 to-cyan-300"
            initial={{ width: "4%" }}
            animate={{ width: `${Math.max(4, uploadProgress)}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        )}
      </button>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10.5px] leading-5 text-slate-400">
        <LockKeyhole className="size-3" />
        Each recipient receives a separate copy. Submission is not delivery confirmation.
      </p>
    </div>
  );
}
