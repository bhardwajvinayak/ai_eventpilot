"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Pencil, Printer } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge, EmptyState, Notice, ProgressBar, Spinner } from "@/components/ui/primitives";
import { useEvents } from "@/components/events-provider";
import { StorageNotice } from "@/components/storage-notice";
import { BudgetPlanner } from "@/components/budget/budget-planner";
import { Timeline } from "@/components/timeline/timeline";
import { VendorChecklist } from "@/components/vendors/vendor-checklist";
import { DeleteEventButton } from "@/components/events/delete-button";
import { EditDetails } from "@/components/events/edit-details";
import { EventDayChecklist, PlanOverview } from "@/components/events/plan-overview";
import { eventProgress } from "@/lib/plan";
import { EVENT_TYPE_LABELS, type EventForm, type SavedEvent } from "@/lib/schemas";
import { exportEventJson } from "@/lib/storage";
import { rebaseTimeline } from "@/lib/timeline";
import { formatDate, formatINR, slugify } from "@/lib/utils";

function downloadJson(ev: SavedEvent) {
  const blob = new Blob([exportEventJson(ev)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(ev.form.name)}.eventpilot.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const SECTIONS = [["overview", "Overview"], ["budget", "Budget"], ["timeline", "Timeline"], ["vendors", "Vendors"], ["event-day", "Event day"]] as const;

export function EventView({ id }: { id: string }) {
  const router = useRouter();
  const { events, status, saveEvent, deleteEvent } = useEvents();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const ev = events.find((e) => e.id === id);

  if (status === "loading") return <Spinner label="Loading your event" />;
  if (!ev) {
    return (
      <EmptyState title="We could not find this event" action={<Link href="/" className={buttonClass()}>Back to dashboard</Link>}>
        It may have been deleted, or it was saved in a different browser. Plans are stored in the browser where they were created.
      </EmptyState>
    );
  }

  const update = (patch: Partial<SavedEvent>) => {
    const ok = saveEvent({ ...ev, ...patch });
    setSaved(ok);
  };
  const saveDetails = (form: EventForm) => {
    update({ form, timeline: form.date !== ev.form.date ? rebaseTimeline(ev.timeline, form.date) : ev.timeline });
    setEditing(false);
  };
  const progress = eventProgress(ev);
  const f = ev.form;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-teal-800 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Dashboard
        </Link>
      </div>

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{f.name}</h1>
            <p className="mt-2 text-slate-600">
              {EVENT_TYPE_LABELS[f.type]} on {formatDate(f.date)} in {f.city}, for {f.guestCount} guests over {f.durationHours} hours. Budget {formatINR(f.budget)}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="secondary" small onClick={() => setEditing((v) => !v)}><Pencil className="h-4 w-4" aria-hidden="true" /> Edit details</Button>
            <Button variant="secondary" small onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden="true" /> Print</Button>
            <Button variant="secondary" small onClick={() => downloadJson(ev)}><Download className="h-4 w-4" aria-hidden="true" /> Export JSON</Button>
            <DeleteEventButton name={f.name} onConfirm={() => { deleteEvent(ev.id); router.push("/"); }} />
          </div>
        </div>

        {ev.source === "demo" ? (
          <Notice tone="warning" title="Demo mode: no AI was used">
            This plan was generated locally from templates and your answers. No AI model was called. Add a Gemini API key to get a live AI plan.
          </Notice>
        ) : (
          <div className="flex items-center gap-2"><Badge tone="violet">AI-generated{ev.model ? ` with ${ev.model}` : ""}</Badge></div>
        )}
        <Notice tone="info">
          All amounts are estimates in INR, not vendor quotations. EventPilot has not contacted or booked anyone. Check every price with the vendor.
        </Notice>
        {saved && <p className="text-xs text-slate-500 print:hidden">Changes saved in this browser.</p>}

        <div className="flex items-center gap-3">
          <div className="flex-1"><ProgressBar value={progress.percent} label="Overall completion" /></div>
          <span className="text-sm text-slate-600">{progress.percent}% complete ({progress.done} of {progress.total} tasks)</span>
        </div>
        <StorageNotice />
      </header>

      {editing && <EditDetails form={f} onSave={saveDetails} onCancel={() => setEditing(false)} />}

      <nav aria-label="Sections" className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b border-slate-200 bg-[#fafaf7]/95 px-4 py-2 backdrop-blur print:hidden sm:-mx-6 sm:px-6">
        <ul className="flex gap-2">
          {SECTIONS.map(([anchor, label]) => (
            <li key={anchor}><a href={`#${anchor}`} className="block whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-slate-700 hover:bg-white">{label}</a></li>
          ))}
        </ul>
      </nav>

      <PlanOverview plan={ev.plan} />
      <BudgetPlanner lines={ev.budget} totalBudget={f.budget} type={f.type} onChange={(budget) => update({ budget })} />
      <Timeline items={ev.timeline} eventDate={f.date} onChange={(timeline) => update({ timeline })} />
      <VendorChecklist items={ev.vendors} onChange={(vendors) => update({ vendors })} />
      <EventDayChecklist items={ev.plan.eventDayChecklist} />
    </div>
  );
}
