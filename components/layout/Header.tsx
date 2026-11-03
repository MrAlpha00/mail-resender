"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/compose", label: "Compose" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const open = openForPath === pathname;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenForPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200",
                  active
                    ? "text-navy"
                    : "text-slate-500 hover:text-navy",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="header-active-pill"
                    className="absolute inset-0 rounded-full bg-slate-100"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/compose"
            className="group inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-[13.5px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(23,37,84,0.8)] transition-all duration-200 hover:bg-[#1e3a8a] hover:shadow-[0_12px_26px_-12px_rgba(23,37,84,0.75)]"
          >
            Write an email
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-navy transition-colors hover:bg-slate-50 md:hidden"
          onClick={() => setOpenForPath(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-navigation"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <nav className="container-shell flex flex-col gap-1 py-4" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenForPath(null)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3.5 py-3 text-[15px] font-medium transition-colors",
                      active
                        ? "bg-slate-100 text-navy"
                        : "text-slate-600 hover:bg-slate-50 hover:text-navy",
                    )}
                  >
                    {item.label}
                    <ArrowRight className="size-4 text-slate-400" />
                  </Link>
                );
              })}
              <Link
                href="/compose"
                onClick={() => setOpenForPath(null)}
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-[15px] font-semibold text-white"
              >
                Compose an email
                <ArrowRight className="size-4" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
