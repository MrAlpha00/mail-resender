import {
  FileText,
  LayoutTemplate,
  LockKeyhole,
  Paperclip,
  PenLine,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  {
    icon: Users,
    title: "Multiple Recipients",
    description:
      "Add every address you need in one place. Each recipient receives their own private copy.",
    tint: "bg-blue-50 text-blue-600",
  },
  {
    icon: Paperclip,
    title: "File Attachments",
    description:
      "Attach photos, PDFs, and approved documents with clear limits and validation at every step.",
    tint: "bg-violet-50 text-violet-600",
  },
  {
    icon: LayoutTemplate,
    title: "Beautiful Email Templates",
    description:
      "Pick from three professionally designed layouts that hold up in every major email client.",
    tint: "bg-amber-50 text-amber-600",
  },
  {
    icon: PenLine,
    title: "Simple Composition",
    description:
      "A focused editor with just the essentials — no complicated inbox, no clutter, no noise.",
    tint: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure Delivery",
    description:
      "Messages are delivered through Resend from a fixed, server-controlled sender. The From address cannot be changed in the browser.",
    tint: "bg-sky-50 text-sky-600",
  },
  {
    icon: LockKeyhole,
    title: "Privacy Focused",
    description:
      "No personal mailbox connection, no stored messages, and no shared recipient list.",
    tint: "bg-rose-50 text-rose-600",
  },
];

const strip = [
  { icon: Send, label: "Resend-powered delivery" },
  { icon: FileText, label: "Plain-text alternative included" },
  { icon: ShieldCheck, label: "Rate limits & daily quotas" },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="container-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Built for the important stuff"
            title="Everything you need to send something worth reading."
            description="MailDrop keeps the power of a professional email tool and removes the parts that make sending feel like work."
          />
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.045}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-soft">
                  <div className="pointer-events-none absolute -right-16 -top-16 size-36 rounded-full bg-blue-50/0 blur-2xl transition-colors duration-300 group-hover:bg-blue-50/80" />
                  <span className={`relative grid size-11 place-items-center rounded-xl ${feature.tint}`}>
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <h3 className="relative mt-5 text-[16.5px] font-semibold tracking-[-0.015em] text-navy">
                    {feature.title}
                  </h3>
                  <p className="relative mt-2 text-[13.5px] leading-6 text-slate-500">
                    {feature.description}
                  </p>
                  <span className="absolute right-5 top-5 text-[10px] font-semibold tabular-nums text-slate-200">
                    0{index + 1}
                  </span>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-5 py-4 text-[12px] text-slate-500 sm:flex-row sm:gap-8">
            {strip.map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.label} className="inline-flex items-center gap-2">
                  <Icon className="size-3.5 text-blue-500" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
