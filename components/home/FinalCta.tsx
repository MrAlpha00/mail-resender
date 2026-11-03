import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { buttonStyles } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="pb-20 sm:pb-24">
      <div className="container-shell">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0b1533] px-6 py-12 shadow-float sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 dot-pattern opacity-20" />
            <div className="pointer-events-none absolute -left-24 top-0 size-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-blue-200">
                <Sparkles className="size-3.5" />
                Ready when you are
              </span>
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[2.65rem] sm:leading-[1.12]">
                One message. The right people. No awkward group email.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-[14.5px] leading-7 text-slate-400">
                Compose something clear, add the files people need, and send it
                with the privacy your recipients deserve.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/compose"
                  className={buttonStyles({
                    size: "lg",
                    className:
                      "group w-full bg-white text-navy hover:bg-slate-100 sm:w-auto",
                  })}
                >
                  Compose an Email
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/privacy"
                  className={buttonStyles({
                    variant: "ghost",
                    size: "lg",
                    className:
                      "w-full border border-white/15 text-slate-200 hover:bg-white/[0.07] hover:text-white sm:w-auto",
                  })}
                >
                  How your data is handled
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
