import Link from "next/link";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}

export function Logo({ href = "/", tone = "light", compact = false, className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="MailDrop home"
    >
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-[11px] bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6] shadow-[0_6px_18px_-6px_rgba(37,99,235,0.65)] transition-transform duration-300 group-hover:-translate-y-0.5">
        <span className="absolute inset-x-0 top-0 h-px bg-white/35" />
        <Send className="size-[17px] -translate-x-px text-white" strokeWidth={2.3} />
      </span>
      {!compact && (
        <span
          className={cn(
            "text-[19px] font-semibold tracking-[-0.03em]",
            tone === "dark" ? "text-white" : "text-navy",
          )}
        >
          Mail<span className={tone === "dark" ? "text-blue-300" : "text-accent-strong"}>Drop</span>
        </span>
      )}
    </Link>
  );
}
