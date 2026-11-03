import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-navy text-white shadow-[0_10px_24px_-12px_rgba(23,37,84,0.8)] hover:bg-[#1e3a8a] hover:shadow-[0_14px_30px_-14px_rgba(23,37,84,0.75)]",
  secondary:
    "border border-slate-200 bg-white text-navy shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-navy",
  accent:
    "bg-accent-strong text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.8)] hover:bg-blue-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-full px-3.5 text-[13px]",
  md: "h-11 gap-2 rounded-full px-5 text-sm",
  lg: "h-12 gap-2.5 rounded-full px-6 text-[15px]",
  icon: "size-10 rounded-full",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
});
