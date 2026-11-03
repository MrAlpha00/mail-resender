import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-navy text-white shadow-soft">
        <Compass className="size-6" />
      </span>
      <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        404 — Place not found
      </p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-navy sm:text-4xl">
        This page wandered off.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        The link may be old, or the page may have moved. Your next message is still one click away.
      </p>
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <Link href="/" className={buttonStyles({ size: "md" })}>
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <Link href="/compose" className={buttonStyles({ variant: "secondary", size: "md" })}>
          Compose an email
        </Link>
      </div>
    </div>
  );
}
