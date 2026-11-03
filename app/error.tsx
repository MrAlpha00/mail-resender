"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-600">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.035em] text-navy">
        Something went wrong on this page.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        No email was sent by this error. Try the page again, or head back home and start fresh.
      </p>
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <Button onClick={reset} size="md">
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <a href="/" className={buttonStyles({ variant: "secondary", size: "md" })}>
          Back to home
        </a>
      </div>
    </div>
  );
}
