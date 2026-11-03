import {
  Check,
  Clock3,
  LockKeyhole,
  MailCheck,
  Server,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";

const assurances = [
  {
    icon: UserRoundCheck,
    title: "Recipients stay private",
    description:
      "Every copy is sent individually. Nobody sees the rest of your recipient list.",
  },
  {
    icon: LockKeyhole,
    title: "No inbox connection",
    description:
      "MailDrop never asks for your personal email password or access to your mailbox.",
  },
  {
    icon: Clock3,
    title: "Nothing kept around",
    description:
      "Uploaded files stay in memory for the request only and are discarded after sending.",
  },
  {
    icon: Server,
    title: "A verified sender you control",
    description:
      "The From address comes from a domain verified by the site owner in Resend.",
  },
];

export function SecuritySection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="container-shell">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-card">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal className="p-7 sm:p-10 lg:p-12">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong">
                Privacy is the product
              </p>
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-navy sm:text-4xl">
                Your message goes to the people you chose. Nobody else.
              </h2>
              <p className="mt-4 max-w-xl text-[14.5px] leading-7 text-slate-500">
                Group email shouldn&apos;t expose your contacts. MailDrop uses
                individual delivery by default, with server-side validation and
                bot protection on every submission.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {assurances.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <h3 className="text-[13.5px] font-semibold text-navy">{item.title}</h3>
                        <p className="mt-1 text-[12.5px] leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/privacy"
                className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-700 transition-colors hover:text-blue-800"
              >
                Read the privacy notice
                <span aria-hidden="true">→</span>
              </Link>
            </Reveal>

            <div className="relative flex items-center justify-center overflow-hidden bg-[#0b1533] p-7 sm:p-10">
              <div className="pointer-events-none absolute inset-0 dot-pattern opacity-30" />
              <div className="pointer-events-none absolute -right-20 top-0 size-64 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="relative w-full max-w-sm">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                      <ShieldCheck className="size-4" />
                      Private delivery
                    </span>
                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                      Protected
                    </span>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {["Recipient one", "Recipient two", "Recipient three"].map(
                      (label, index) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#101d3a] px-3.5 py-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-7 place-items-center rounded-lg bg-white/[0.06] text-blue-200">
                              <MailCheck className="size-3.5" />
                            </span>
                            <div>
                              <p className="text-[11.5px] font-medium text-slate-200">{label}</p>
                              <p className="text-[9.5px] text-slate-500">Individual copy</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-emerald-300">
                            <Check className="size-3" strokeWidth={3} />
                            Queued
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-400/15 bg-blue-400/[0.08] px-3.5 py-3">
                    <LockKeyhole className="size-4 shrink-0 text-blue-300" />
                    <p className="text-[10.5px] leading-4 text-slate-300">
                      Addresses are never shared between recipients.
                    </p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 hidden rounded-xl border border-white/10 bg-[#132447] px-3 py-2 shadow-xl sm:block">
                  <p className="text-[9px] font-medium text-slate-400">Transport secured by</p>
                  <p className="text-[11px] font-semibold text-white">Resend</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
