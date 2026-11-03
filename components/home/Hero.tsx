"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  LayoutTemplate,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/Button";

const trustItems = ["No personal inbox required", "Private individual delivery", "Bot-protected"];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const intro = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative overflow-hidden hero-glow">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-70" />
      <div className="pointer-events-none absolute -left-28 top-24 size-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 size-80 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="container-shell relative grid items-center gap-14 pb-20 pt-14 sm:pb-24 sm:pt-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:pb-28 lg:pt-24">
        <div className="max-w-xl">
          <motion.div {...intro(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 py-1.5 pl-2 pr-3.5 text-[11.5px] font-semibold text-blue-800 shadow-sm backdrop-blur">
              <span className="grid size-5 place-items-center rounded-full bg-blue-100">
                <Sparkles className="size-3 text-blue-700" />
              </span>
              Private by design · no inbox connection
            </span>
          </motion.div>

          <motion.h1
            {...intro(0.07)}
            className="mt-6 text-balance text-[2.65rem] font-semibold leading-[1.06] tracking-[-0.045em] text-navy sm:text-6xl lg:text-[4rem]"
          >
            Your Message.
            <br className="hidden sm:block" /> Your Recipients.{" "}
            <span className="text-gradient">One Simple Place.</span>
          </motion.h1>

          <motion.p
            {...intro(0.14)}
            className="mt-6 max-w-lg text-pretty text-[15.5px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8"
          >
            Compose beautifully formatted emails, attach your files, and deliver
            your information securely to multiple recipients.
          </motion.p>

          <motion.div {...intro(0.2)} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/compose" className={buttonStyles({ size: "lg", className: "group w-full sm:w-auto" })}>
              Compose an Email
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className={buttonStyles({ variant: "secondary", size: "lg", className: "group w-full sm:w-auto" })}
            >
              Learn How It Works
              <ArrowDown className="size-4 text-slate-400 transition-transform duration-200 group-hover:translate-y-0.5" />
            </a>
          </motion.div>

          <motion.ul
            {...intro(0.27)}
            className="mt-8 flex flex-col gap-3 text-[13px] text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5"
          >
            {trustItems.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span className="grid size-4 place-items-center rounded-full bg-blue-100">
                  <Check className="size-2.5 text-blue-700" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          aria-hidden="true"
          className="relative mx-auto w-full max-w-[500px] lg:max-w-none"
          initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-blue-200/40 via-indigo-100/20 to-transparent blur-2xl" />

          <div className="relative rounded-[1.75rem] border border-white/80 bg-white/90 p-2.5 shadow-float backdrop-blur">
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-300" />
                  <span className="size-2 rounded-full bg-amber-300" />
                  <span className="size-2 rounded-full bg-emerald-300" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  New message
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                  <ShieldCheck className="size-2.5" />
                  Private
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    To
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["alex@studio.co", "priya@north.io", "+3"].map((email, index) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700"
                      >
                        {index < 2 && <span className="size-1.5 rounded-full bg-blue-400" />}
                        {email}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 px-3 py-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Subject
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-slate-700">
                    Project update &amp; final files
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 px-3 py-2.5">
                  <p className="text-[11px] font-medium leading-5 text-slate-700">
                    Hi there,
                    <br />
                    Here are the final files and a short summary of where things stand.
                  </p>
                  <div className="mt-2.5 space-y-1.5">
                    <span className="block h-1.5 w-[88%] rounded-full bg-slate-100" />
                    <span className="block h-1.5 w-[72%] rounded-full bg-slate-100" />
                    <span className="block h-1.5 w-[46%] rounded-full bg-slate-100" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[9.5px] font-medium text-slate-600">
                    <Paperclip className="size-2.5" />
                    proposal.pdf
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[9.5px] font-medium text-slate-600">
                    <Paperclip className="size-2.5" />
                    hero.jpg
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1">
                    {["Professional", "Minimal", "Dark"].map((template, index) => (
                      <span
                        key={template}
                        className={
                          index === 0
                            ? "rounded-md bg-white px-2 py-1 text-[9px] font-semibold text-navy shadow-sm"
                            : "px-2 py-1 text-[9px] font-medium text-slate-400"
                        }
                      >
                        {template}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1.5 text-[9.5px] font-semibold text-white">
                    Send
                    <Send className="size-2.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 -top-5 hidden animate-float rounded-xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-soft sm:block">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold text-slate-800">Delivered individually</p>
                <p className="text-[9px] text-slate-400">Recipients stay private</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-4 hidden animate-float-slow rounded-xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-soft sm:block">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <LayoutTemplate className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold text-slate-800">Three polished templates</p>
                <p className="text-[9px] text-slate-400">Made for real inboxes</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-5 bottom-20 hidden animate-float-slow rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-soft lg:block">
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-slate-400" />
              <p className="text-[9.5px] font-medium text-slate-600">One message, every recipient</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
