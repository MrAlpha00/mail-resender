"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { EMAIL_TEMPLATES, type EmailTemplateId } from "@/types/email";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  value: EmailTemplateId;
  onChange: (template: EmailTemplateId) => void;
  disabled?: boolean;
}

export function TemplateSelector({ value, onChange, disabled = false }: TemplateSelectorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <fieldset disabled={disabled}>
      <legend className="text-[13px] font-semibold text-navy">Email template</legend>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">
        This changes the actual email your recipients receive.
      </p>

      <div className="mt-3 space-y-2.5">
        {EMAIL_TEMPLATES.map((template) => {
          const selected = value === template.id;
          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(template.id)}
              disabled={disabled}
              className={cn(
                "group flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition-all duration-200 disabled:opacity-60",
                selected
                  ? "border-blue-400 bg-blue-50/40 ring-4 ring-blue-500/10"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60",
              )}
            >
              <span
                aria-hidden="true"
                className="relative block h-[72px] w-[58px] shrink-0 overflow-hidden rounded-lg border border-black/5"
                style={{ backgroundColor: template.swatches.page }}
              >
                <span
                  className="absolute inset-x-1.5 top-2.5 block rounded-[3px] p-1.5 shadow-sm"
                  style={{ backgroundColor: template.swatches.card }}
                >
                  <span
                    className="block h-1 w-4 rounded-full"
                    style={{ backgroundColor: template.swatches.accent }}
                  />
                  <span className="mt-1.5 block h-[3px] w-full rounded-full bg-slate-300/80" />
                  <span className="mt-1 block h-[3px] w-4/5 rounded-full bg-slate-200" />
                  <span className="mt-1 block h-[3px] w-3/5 rounded-full bg-slate-200" />
                  <span className="mt-1.5 block h-2 w-full rounded-[2px] bg-slate-100" />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-navy">{template.name}</span>
                  {selected ? (
                    <motion.span
                      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="grid size-4 shrink-0 place-items-center rounded-full bg-blue-600 text-white"
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <span className="mt-0.5 size-4 shrink-0 rounded-full border border-slate-300 bg-white" />
                  )}
                </span>
                <span className="mt-1 block text-[10.5px] leading-4 text-slate-500">
                  {template.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
