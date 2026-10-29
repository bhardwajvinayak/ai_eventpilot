"use client";

import { Badge, Card, Notice, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { daysBetween, relativeLabel, sortTimeline, timelineWarnings, todayISO } from "@/lib/timeline";
import type { TimelineItem } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";

const TONE = { high: "red", medium: "amber", low: "neutral" } as const;

export function Timeline({ items, eventDate, onChange }: { items: TimelineItem[]; eventDate: string; onChange: (items: TimelineItem[]) => void }) {
  const today = todayISO();
  const warnings = timelineWarnings(eventDate, items, today);
  const eventPassed = daysBetween(today, eventDate) < 0;
  const sorted = sortTimeline(items);
  const done = items.filter((t) => t.done).length;

  const toggle = (id: string) => onChange(items.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <Card id="timeline">
      <SectionTitle title="Preparation timeline" description="Deadlines are counted back from your event date. Tick tasks off as you finish them." />
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1"><ProgressBar value={items.length ? (done / items.length) * 100 : 0} label="Timeline progress" /></div>
        <span className="text-sm text-slate-600">{done} of {items.length} done</span>
      </div>
      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((w) => <Notice key={w} tone="warning">{w}</Notice>)}
        </div>
      )}
      <ul className="space-y-2">
        {sorted.map((t) => {
          const overdue = !eventPassed && !t.done && !t.compressed && t.dueDate < today;
          return (
            <li key={t.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <input id={`tl-${t.id}`} type="checkbox" checked={t.done} onChange={() => toggle(t.id)} className="mt-1 h-5 w-5 shrink-0 accent-teal-700" />
              <div className="min-w-0 flex-1">
                <label htmlFor={`tl-${t.id}`} className={cn("font-medium", t.done && "text-slate-400 line-through")}>{t.title}</label>
                <p className="text-sm text-slate-600">
                  {formatDate(t.dueDate)}
                  <span className="ml-2 text-slate-500">{relativeLabel(t.dueDate, today)}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={TONE[t.priority]}>{t.priority} priority</Badge>
                {t.compressed && <Badge tone="violet">Moved to today</Badge>}
                {overdue && <Badge tone="red">Overdue</Badge>}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
