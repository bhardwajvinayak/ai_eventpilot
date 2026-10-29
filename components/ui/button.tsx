import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 shadow-sm",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

/** Class names for anything that should look like a button, including next/link. */
export function buttonClass(variant: ButtonVariant = "primary", small = false, extra?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    small ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
    VARIANTS[variant],
    extra,
  );
}

export function Button({
  variant = "primary",
  small = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; small?: boolean }) {
  return <button type={type} className={buttonClass(variant, small, className)} {...props} />;
}
