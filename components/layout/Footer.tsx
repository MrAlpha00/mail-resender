import { ExternalLink, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

const productLinks = [
  { href: "/", label: "Home" },
  { href: "/compose", label: "Compose" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Acceptable use" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#0b1533] text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_88%_100%,rgba(37,99,235,0.12),transparent_32%)]" />
      <div className="container-shell relative py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-md">
            <Logo tone="dark" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              A calmer way to send something important. Compose once, reach the
              right people, and keep every recipient&apos;s address private.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-300">
                <ShieldCheck className="size-3.5 text-blue-300" />
                Private by design
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-300">
                <LockKeyhole className="size-3.5 text-blue-300" />
                No inbox access
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Product
            </h2>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Trust &amp; legal
            </h2>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Delivery by Resend
                  <ExternalLink className="size-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} MailDrop. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            <Mail className="size-3.5" />
            Built for messages that deserve to arrive.
          </p>
        </div>
      </div>
    </footer>
  );
}
