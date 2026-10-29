"use client";

import Link from "next/link";
import { Cake, CalendarClock, GraduationCap, Heart, PartyPopper, Plus, Sparkles, Users, type LucideIcon } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Badge, Card, EmptyState, ProgressBar, Spinner } from "@/components/ui/primitives";
import { useEvents } from "@/components/events-provider";
import { StorageNotice } from "@/components/storage-notice";
import { DeleteEventButton } from "@/components/events/delete-button";
import { ImportButton } from "@/components/events/import-button";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/schemas";
import { eventProgress } from "@/lib/plan";
import { daysBetween, relativeLabel, todayISO } from "@/lib/timeline";
import { formatDate, formatINR } from "@/lib/utils";

const CATEGORIES: Array<{ type: EventType; blurb: string; Icon: LucideIcon }> = [
  { type: "wedding", blurb: "Multi-day planning with a long runway.", Icon: Heart },
  { type: "birthday", blurb: "Quick, friendly parties for any age.", Icon: Cake },
  { type: "college", blurb: "Fests, farewells and club events.", Icon: GraduationCap },
  { type: "community", blurb: "Society, temple and neighbourhood gatherings.", Icon: Users },
  { type: "anniversary", blurb: "Intimate celebrations for two or many.", Icon: Sparkles },
  { type: "other", blurb: "Baby showers, reunions and more.", Icon: PartyPopper },
];

export function Dashboard() {
  const { events, status, deleteEvent } = useEvents();
  const today = todayISO();

  const upcoming = events.filter((e) => e.form.date >= today).sort((a, b) => a.form.date.localeCompare(b.form.date));
  const totals = events.reduce((acc, e) => {
    const p = eventProgress(e);
    return { done: acc.done + p.done, total: acc.total + p.total };
  }, { done: 0, total: 0 });
  const overall = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <div className="space-y-10">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Welcome to AI EventPilot</h1>
        <p className="mt-4 text-lg text-slate-600">
          Tell us about your event and get a personalised plan with a budget in rupees, a dated preparation timeline and a vendor checklist.
          Everything stays in your browser.
        </p>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          <Link href="/events/new" className={buttonClass("primary")}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create new event
          </Link>
          <ImportButton />
        </div>
      </section>

      <section aria-labelledby="categories">
        <h2 id="categories" className="mb-4 text-xl font-semibold">Start with the kind of event you are planning</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ type, blurb, Icon }) => (
            <li key={type}>
              <Link href={`/events/new?type=${type}`} className="flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-600">
                <span className="rounded-xl bg-teal-50 p-2 text-teal-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span>
                  <span className="block font-medium text-slate-900">{EVENT_TYPE_LABELS[type]}</span>
                  <span className="block text-sm text-slate-600">{blurb}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="saved">
        <h2 id="saved" className="mb-4 text-xl font-semibold">Your events</h2>
        {status === "loading" ? (
          <Spinner label="Loading your saved events" />
        ) : events.length === 0 ? (
          <EmptyState title="No events yet" action={<Link href="/events/new" className={buttonClass()}>Plan your first event</Link>}>
            Your saved plans will show up here with their budget, deadlines and progress. You can also import a plan you exported earlier.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            <dl className="grid gap-3 sm:grid-cols-3">
              <Stat label="Events planned" value={String(events.length)} />
              <Stat label="Upcoming events" value={String(upcoming.length)} />
              <Stat label="Tasks completed" value={`${overall}%`} />
            </dl>

            {upcoming.length > 0 && (
              <Card>
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                  <CalendarClock className="h-4 w-4 text-violet-700" aria-hidden="true" /> Upcoming dates
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {upcoming.slice(0, 3).map((e) => (
                    <li key={e.id} className="flex flex-wrap justify-between gap-2">
                      <Link href={`/events/${e.id}`} className="font-medium text-teal-800 underline-offset-2 hover:underline">{e.form.name}</Link>
                      <span className="text-slate-600">{formatDate(e.form.date)}, {relativeLabel(e.form.date, today).toLowerCase()}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <ul className="space-y-3">
              {events.map((e) => {
                const p = eventProgress(e);
                const days = daysBetween(today, e.form.date);
                return (
                  <li key={e.id}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold"><Link href={`/events/${e.id}`} className="hover:underline">{e.form.name}</Link></h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatDate(e.form.date)} in {e.form.city}, {e.form.guestCount} guests, budget {formatINR(e.form.budget)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="teal">{EVENT_TYPE_LABELS[e.form.type]}</Badge>
                            {e.source === "demo" && <Badge tone="amber">Demo plan</Badge>}
                            {days < 0 && <Badge tone="neutral">Date passed</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/events/${e.id}`} className={buttonClass("primary", true)}>Open</Link>
                          <DeleteEventButton name={e.form.name} onConfirm={() => deleteEvent(e.id)} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1"><ProgressBar value={p.percent} label={`${e.form.name} completion`} /></div>
                        <span className="text-sm text-slate-600">{p.done} of {p.total} tasks done</span>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="mt-6"><StorageNotice /></div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold text-slate-900" style={{ fontFamily: "Georgia, Cambria, serif" }}>{value}</dd>
    </div>
  );
}
