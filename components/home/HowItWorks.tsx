import { AtSign, ArrowRight, Eye, PenLine } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { buttonStyles } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    icon: AtSign,
    number: "01",
    title: "Enter your recipients",
    description:
      "Paste one address or a whole list. MailDrop validates each one, removes duplicates, and keeps them private.",
  },
  {
    icon: PenLine,
    number: "02",
    title: "Write and attach",
    description:
      "Add a clear subject, your message, and the files that matter. Choose a template that fits the tone.",
  },
  {
    icon: Eye,
    number: "03",
    title: "Preview and send",
    description:
      "See the real email before it leaves. Then submit it through a secure, bot-protected delivery flow.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 overflow-hidden border-y border-slate-200/70 bg-white py-20 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.06),transparent_38%)]" />
      <div className="container-shell relative">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="From blank page to sent in three calm steps."
            description="No setup maze. No account creation. Just a thoughtful composition flow that gets out of your way."
          />
        </Reveal>

        <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[46px] hidden border-t border-dashed border-slate-200 lg:block" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={index * 0.08}>
                <article className="relative h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-300 hover:border-blue-200 hover:shadow-soft sm:p-7">
                  <div className="flex items-start justify-between">
                    <span className="relative z-10 grid size-12 place-items-center rounded-2xl bg-navy text-white shadow-[0_10px_24px_-14px_rgba(23,37,84,0.9)]">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[11px] font-semibold tabular-nums tracking-[0.18em] text-slate-300">
                      STEP {step.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-[17px] font-semibold tracking-[-0.015em] text-navy">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-6 text-slate-500">
                    {step.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-10 flex justify-center">
            <Link href="/compose" className={buttonStyles({ variant: "secondary", size: "md", className: "group" })}>
              Start composing
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
