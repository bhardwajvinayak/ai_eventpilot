import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 print:shadow-none", className)}>
      {children}
    </section>
  );
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="mt-1 max-w-prose text-sm text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const BADGE = {
  neutral: "bg-slate-100 text-slate-700",
  teal: "bg-teal-50 text-teal-800",
  violet: "bg-violet-50 text-violet-800",
  amber: "bg-amber-50 text-amber-900",
  red: "bg-red-50 text-red-800",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", BADGE[tone])}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-teal-600" style={{ width: `${v}%` }} />
    </div>
  );
}

const NOTICE = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", Icon: Info },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", Icon: CheckCircle2 },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  error: { box: "border-red-200 bg-red-50 text-red-900", Icon: XCircle },
} as const;

export function Notice({ tone = "info", title, children, actions }: { tone?: keyof typeof NOTICE; title?: string; children?: ReactNode; actions?: ReactNode }) {
  const { box, Icon } = NOTICE[tone];
  return (
    <div role={tone === "error" || tone === "warning" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", box)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1")}>{children}</div>}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600" role="status">
      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={text} className="rounded-full text-slate-400 hover:text-slate-600">
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-normal text-white shadow-lg group-focus-within:block group-hover:block print:hidden">
        {text}
      </span>
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{children}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
