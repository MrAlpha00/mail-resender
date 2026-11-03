import { FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";

interface LegalShellProps {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  toc: Array<{ id: string; label: string }>;
  children: React.ReactNode;
}

export function LegalShell({
  eyebrow,
  title,
  description,
  updated,
  toc,
  children,
}: LegalShellProps) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
        <div className="pointer-events-none absolute -right-24 -top-20 size-72 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="container-shell relative max-w-5xl py-12 sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
            <ShieldCheck className="size-3" />
            {eyebrow}
          </span>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] text-navy sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-[14.5px] leading-7 text-slate-500">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-[10.5px] text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
              <FileText className="size-3" />
              Last updated {updated}
            </span>
            <Link href="/compose" className="font-medium text-blue-700 hover:text-blue-800">
              Back to the composer →
            </Link>
          </div>
        </div>
      </section>

      <div className="container-shell max-w-5xl py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              On this page
            </p>
            <nav className="mt-3 flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5" aria-label="On this page">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-navy"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 hidden rounded-xl border border-slate-200 bg-white p-3.5 lg:block">
              <p className="text-[10.5px] font-semibold text-navy">Privacy-first defaults</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                No mailbox connection. No stored message content. Individual delivery.
              </p>
            </div>
          </aside>

          <Reveal>
            <article className="legal-prose rounded-2xl border border-slate-200/80 bg-white px-5 py-7 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-8 sm:py-9">
              {children}
            </article>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
