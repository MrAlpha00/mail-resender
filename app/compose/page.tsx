import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck, Sparkles, Users } from "lucide-react";

import { ComposerForm } from "@/components/email/ComposerForm";
import { getComposerConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compose an email",
  description:
    "Write your message, add recipients and attachments, preview all three email templates, and submit securely.",
  alternates: { canonical: "/compose" },
  robots: { index: true, follow: true },
};

export default function ComposePage() {
  const config = getComposerConfig();

  return (
    <div className="relative">
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-50" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="container-shell relative py-9 sm:py-11">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-navy"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                <Sparkles className="size-3" />
                Secure composition
              </span>
              <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-[2.35rem]">
                Compose something worth opening.
              </h1>
              <p className="mt-2 max-w-xl text-pretty text-[13.5px] leading-6 text-slate-500">
                Add your recipients, write a clear message, attach what matters, and see the
                finished email before anything is submitted.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5">
                <Users className="size-3 text-blue-500" />
                Up to {config.maxRecipients} recipients
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5">
                <ShieldCheck className="size-3 text-emerald-500" />
                Individual delivery
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5">
                <LockKeyhole className="size-3 text-slate-400" />
                No inbox access
              </span>
            </div>
          </div>
        </div>
      </section>

      <ComposerForm config={config} />
    </div>
  );
}
