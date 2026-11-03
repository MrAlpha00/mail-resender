"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Home,
  MailCheck,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/Button";
import type { SendEmailSuccessResponse } from "@/types/email";
import { cn } from "@/lib/utils";

interface SuccessScreenProps {
  result: SendEmailSuccessResponse;
  onReset: () => void;
  onRetryFailed: () => void;
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50/60"
          : tone === "danger"
            ? "border-red-200 bg-red-50/60"
            : "border-slate-200 bg-slate-50/70",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.13em]",
          tone === "success"
            ? "text-emerald-700"
            : tone === "danger"
              ? "text-red-600"
              : "text-slate-500",
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-navy">
        {value}
      </p>
    </div>
  );
}

export function SuccessScreen({ result, onReset, onRetryFailed }: SuccessScreenProps) {
  const reduceMotion = useReducedMotion();
  const { accepted, failed, total } = result.summary;
  const allAccepted = total > 0 && failed === 0;
  const allFailed = accepted === 0;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-3xl"
    >
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-card">
        <div
          className={cn(
            "relative overflow-hidden px-6 pb-8 pt-9 text-center sm:px-10 sm:pt-11",
            allAccepted
              ? "bg-gradient-to-b from-emerald-50/80 to-white"
              : allFailed
                ? "bg-gradient-to-b from-red-50/70 to-white"
                : "bg-gradient-to-b from-amber-50/70 to-white",
          )}
        >
          <div className="pointer-events-none absolute inset-0 dot-pattern opacity-25" />
          <motion.div
            initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
            className={cn(
              "relative mx-auto grid size-16 place-items-center rounded-2xl shadow-lg",
              allAccepted
                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                : allFailed
                  ? "bg-red-500 text-white shadow-red-500/20"
                  : "bg-amber-500 text-white shadow-amber-500/20",
            )}
          >
            {allAccepted ? (
              <MailCheck className="size-7" />
            ) : allFailed ? (
              <XCircle className="size-7" />
            ) : (
              <AlertCircle className="size-7" />
            )}
          </motion.div>

          <p className="relative mt-5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Submission report
          </p>
          <h1 className="relative mt-2 text-balance text-2xl font-semibold tracking-[-0.035em] text-navy sm:text-[1.75rem]">
            {allAccepted
              ? "Your email has been submitted successfully."
              : allFailed
                ? "Your email could not be submitted."
                : "Your email was submitted with some issues."}
          </h1>
          <p className="relative mx-auto mt-2.5 max-w-xl text-[12.5px] leading-6 text-slate-500">
            {allAccepted
              ? "The email provider accepted every copy. This confirms submission — not final inbox delivery. Your provider dashboard holds delivery events."
              : allFailed
                ? "The email provider did not accept any copies. Review the details below, then try again."
                : "Some copies were accepted and others were not. You can retry only the failed recipients below."}
          </p>
        </div>

        <div className="border-t border-slate-100 px-5 py-5 sm:px-8">
          <div className="grid grid-cols-3 gap-2.5">
            <SummaryTile label="Processed" value={total} tone="neutral" />
            <SummaryTile label="Accepted" value={accepted} tone="success" />
            <SummaryTile label="Failed" value={failed} tone={failed > 0 ? "danger" : "neutral"} />
          </div>

          <div className="mt-5">
            <h2 className="text-[12px] font-semibold text-navy">Per-recipient status</h2>
            <ul className="mt-2.5 max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {result.results.map((item) => {
                const acceptedCopy = item.status === "accepted";
                return (
                  <li
                    key={item.recipient}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                        acceptedCopy
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500",
                      )}
                    >
                      {acceptedCopy ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-slate-700">
                        {item.recipient}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[10.5px] leading-4",
                          acceptedCopy ? "text-emerald-700" : "text-red-600",
                        )}
                      >
                        {acceptedCopy
                          ? "Accepted by the email provider · Awaiting inbox delivery"
                          : (item.error ?? "The provider did not accept this copy.")}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "mt-1 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]",
                        acceptedCopy
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      {acceptedCopy ? "Submitted" : "Failed"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-3 text-[10.5px] leading-5 text-blue-900">
            <Clock3 className="mt-0.5 size-3.5 shrink-0" />
            <span>
              &ldquo;Accepted&rdquo; means Resend accepted the email request. It does not
              guarantee inbox delivery. Bounces or provider issues are reported in the
              Resend dashboard.
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Button onClick={onReset} className="flex-1">
              <RotateCcw className="size-4" />
              Compose Another Email
            </Button>
            {failed > 0 && (
              <Button variant="secondary" onClick={onRetryFailed} className="flex-1">
                <ArrowLeft className="size-4" />
                Retry failed recipients
              </Button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500 transition-colors hover:text-navy"
            >
              <Home className="size-3.5" />
              Back to home
            </Link>
            <p className="text-[9.5px] font-medium text-slate-400">
              Request {result.requestId.slice(0, 8)} · No message content stored
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[10px] text-slate-400">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Individual delivery · Recipient addresses were never shared
          </div>
        </div>
      </div>
    </motion.div>
  );
}
