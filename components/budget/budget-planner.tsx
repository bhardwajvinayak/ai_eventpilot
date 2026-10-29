"use client";

import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { reconcileBudget, setLineAmount, summarizeBudget } from "@/lib/budget";
import type { BudgetLine, EventType } from "@/lib/schemas";
import { formatINR } from "@/lib/utils";

const COLORS = ["#0f766e", "#6d5bd0", "#0e7490", "#a78bfa", "#14b8a6", "#4f46e5", "#0891b2", "#8b5cf6", "#64748b"];

type Props = { lines: BudgetLine[]; totalBudget: number; type: EventType; onChange: (lines: BudgetLine[]) => void };

export function BudgetPlanner({ lines, totalBudget, type, onChange }: Props) {
  const s = summarizeBudget(lines, totalBudget);
  const basis = Math.max(s.totalBudget, s.totalEstimated, 1);
  const limitAt = (s.totalBudget / basis) * 100;

  return (
    <Card id="budget">
      <SectionTitle
        title="Budget planner"
        description="Amounts are planning estimates in rupees, not vendor quotations. Edit any amount and the totals update immediately."
        action={
          <Button variant="secondary" small onClick={() => onChange(reconcileBudget(lines, totalBudget, type))} className="print:hidden">
            <Scale className="h-4 w-4" aria-hidden="true" /> Scale to budget
          </Button>
        }
      />

      <dl className="mb-5 grid gap-3 sm:grid-cols-3">
        <Figure label="Total budget" value={formatINR(s.totalBudget)} />
        <Figure label="Estimated total" value={formatINR(s.totalEstimated)} />
        <Figure
          label={s.overBudget ? "Over budget by" : "Remaining"}
          value={formatINR(s.overBudget ? s.deficit : s.remaining)}
          tone={s.overBudget ? "bad" : "good"}
        />
      </dl>

      {s.overBudget ? (
        <Notice tone="warning" title="Planned spending is above your budget">
          You have planned {formatINR(s.totalEstimated)} against a budget of {formatINR(s.totalBudget)}. Lower a category, or choose Scale to budget to shrink every category proportionally.
        </Notice>
      ) : s.remaining === 0 ? (
        <Notice tone="success">Every rupee of your budget is allocated.</Notice>
      ) : (
        <Notice tone="info">{formatINR(s.remaining)} of your budget is not allocated to any category yet.</Notice>
      )}

      <div className="mt-6">
        <div
          role="img"
          aria-label={`Budget chart. ${s.rows.map((r) => `${r.name} ${r.percent} percent`).join(", ")}.`}
          className="relative flex h-7 w-full overflow-hidden rounded-full bg-slate-100"
        >
          {s.rows.map((r, i) =>
            r.amount > 0 ? <div key={r.name} title={`${r.name}: ${formatINR(r.amount)}`} style={{ width: `${(r.amount / basis) * 100}%`, background: COLORS[i % COLORS.length] }} /> : null,
          )}
          {s.overBudget && <div className="absolute inset-y-0 w-0.5 bg-slate-900" style={{ left: `${limitAt}%` }} />}
        </div>
        {s.overBudget && <p className="mt-1 text-xs text-slate-600">The dark line marks your budget limit of {formatINR(s.totalBudget)}.</p>}
      </div>

      <ul className="mt-6 space-y-4">
        {s.rows.map((r, i) => {
          const id = `budget-${i}`;
          return (
            <li key={r.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
              <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} aria-hidden="true" />
                {r.name}
                <span className="font-normal text-slate-500">{r.percent}%</span>
              </label>
              <div className="relative w-36">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500" aria-hidden="true">₹</span>
                <input
                  id={id}
                  type="number"
                  min={0}
                  step={500}
                  inputMode="numeric"
                  placeholder="0"
                  value={r.amount === 0 ? "" : r.amount}
                  onChange={(e) => onChange(setLineAmount(lines, r.name, e.target.value))}
                  className="w-full rounded-lg border border-slate-300 py-1.5 pl-7 pr-2 text-right text-sm focus:border-teal-600"
                />
              </div>
              <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${(r.amount / basis) * 100}%`, background: COLORS[i % COLORS.length] }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-slate-500">Percentages show each category as a share of your estimated total.</p>
    </Card>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd className={`mt-0.5 text-xl font-semibold ${tone === "bad" ? "text-red-700" : "text-slate-900"}`}>{value}</dd>
    </div>
  );
}
