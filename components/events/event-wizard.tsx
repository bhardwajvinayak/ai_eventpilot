"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Notice, Spinner } from "@/components/ui/primitives";
import { useEvents } from "@/components/events-provider";
import { StorageNotice } from "@/components/storage-notice";
import { EventFields } from "@/components/events/event-fields";
import { emptyDraft, validateDraft, type Draft, type FieldErrors, type FieldKey } from "@/lib/form";
import { aiPlanSchema, EVENT_TYPE_LABELS, type EventType } from "@/lib/schemas";
import { buildSavedEvent } from "@/lib/plan";
import { formatDate, formatINR } from "@/lib/utils";

const STEPS: Array<{ title: string; description: string; keys: FieldKey[] }> = [
  { title: "The basics", description: "Tell us what you are celebrating and when.", keys: ["name", "type", "date", "city"] },
  { title: "Size and budget", description: "These numbers shape every recommendation.", keys: ["guestCount", "budget", "durationHours"] },
  { title: "Style and preferences", description: "Optional details that make the plan feel like yours.", keys: ["theme", "foodPreference", "venuePreference"] },
  { title: "Review and generate", description: "Add any special requirements, then check your details.", keys: ["requirements"] },
];

const CLIENT_TIMEOUT_MS = 45_000;

export function EventWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { saveEvent } = useEvents();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(params.get("type")));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const current = STEPS[step];
  const errorCount = Object.keys(errors).length;

  function change(key: FieldKey, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function goTo(n: number) {
    setStep(n);
    setErrors({});
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function next() {
    const v = validateDraft(draft);
    const own: FieldErrors = {};
    if (!v.ok) for (const k of current.keys) if (v.errors[k]) own[k] = v.errors[k];
    if (Object.keys(own).length > 0) return setErrors(own);
    goTo(step + 1);
  }

  async function generate(demo: boolean) {
    const v = validateDraft(draft);
    if (!v.ok) {
      const firstBad = STEPS.findIndex((s) => s.keys.some((k) => v.errors[k]));
      setStep(Math.max(0, firstBad));
      return setErrors(v.errors);
    }
    setBusy(true);
    setApiError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: v.form, demo }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error?.message ?? `The server returned an error (${res.status}). Please try again.`);
      const plan = aiPlanSchema.safeParse(data.plan);
      if (!plan.success) throw new Error("The plan came back in an unexpected format. Please try again.");
      const source = data.source === "demo" ? "demo" : "ai";
      const event = buildSavedEvent({ form: v.form, plan: plan.data, source, model: typeof data.model === "string" ? data.model : undefined });
      saveEvent(event);
      router.push(`/events/${event.id}`);
    } catch (e) {
      const aborted = (e as Error)?.name === "AbortError";
      setApiError(aborted ? "The request took too long. Check your connection and try again." : e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    } finally {
      clearTimeout(timer);
    }
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="space-y-6">
      <nav aria-label="Progress">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                disabled={i >= step || busy}
                onClick={() => goTo(i)}
                aria-current={i === step ? "step" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm ${i === step ? "bg-teal-700 text-white" : i < step ? "bg-teal-50 text-teal-800 hover:bg-teal-100" : "bg-slate-100 text-slate-500"}`}
              >
                {i + 1}. {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Card>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">{current.title}</h2>
        <p className="mb-5 mt-1 text-sm text-slate-600">{current.description}</p>

        {errorCount > 0 && (
          <div className="mb-5">
            <Notice tone="error" title={`Please fix ${errorCount} field${errorCount === 1 ? "" : "s"} to continue`} />
          </div>
        )}

        <fieldset disabled={busy} className="min-w-0 border-0 p-0">
          <legend className="sr-only">{current.title}</legend>
          <EventFields keys={current.keys} draft={draft} errors={errors} onChange={change} idPrefix={`w${step}`} disabled={busy} />
        </fieldset>

        {last && <ReviewSummary draft={draft} />}

        {apiError && (
          <div className="mt-5">
            <Notice
              tone="error"
              title="We could not generate your plan"
              actions={
                <>
                  <Button small onClick={() => generate(false)}>Try again</Button>
                  <Button small variant="secondary" onClick={() => generate(true)}>Use a demo plan instead</Button>
                </>
              }
            >
              {apiError} A demo plan is built locally from templates and does not use AI.
            </Notice>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={step === 0 || busy}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </Button>
          {busy ? (
            <Spinner label="Building your plan. This can take up to 30 seconds." />
          ) : last ? (
            <Button onClick={() => generate(false)}>
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Generate my plan
            </Button>
          ) : (
            <Button onClick={next}>
              Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </Card>
      <StorageNotice compact />
    </div>
  );
}

function ReviewSummary({ draft }: { draft: Draft }) {
  const rows: Array<[string, string]> = [
    ["Event", draft.name || "Not set"],
    ["Type", draft.type ? EVENT_TYPE_LABELS[draft.type as EventType] ?? draft.type : "Not set"],
    ["Date", draft.date ? formatDate(draft.date) : "Not set"],
    ["Location", draft.city || "Not set"],
    ["Guests", draft.guestCount || "Not set"],
    ["Budget", Number(draft.budget) > 0 ? formatINR(Number(draft.budget)) : "Not set"],
    ["Duration", draft.durationHours ? `${draft.durationHours} hours` : "Not set"],
    ["Theme", draft.theme || "Chosen for you"],
    ["Food", draft.foodPreference],
    ["Venue", draft.venuePreference],
  ];
  return (
    <div className="mt-6 rounded-xl bg-slate-50 p-4">
      <h3 className="mb-3 text-base font-semibold">Your details</h3>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-slate-200 pb-1.5">
            <dt className="text-slate-600">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        Your details are sent to the AI service to write the plan. Without an API key, a clearly labelled demo plan is built on this device instead.
      </p>
    </div>
  );
}
