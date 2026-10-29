import { Check } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/primitives";
import type { PlanContent } from "@/lib/schemas";
import { formatINR } from "@/lib/utils";

function IdeaList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 marker:text-teal-600">
        {items.map((t, i) => <li key={`${i}-${t}`}>{t}</li>)}
      </ul>
    </Card>
  );
}

export function PlanOverview({ plan }: { plan: PlanContent }) {
  return (
    <div id="overview" className="space-y-4">
      <Card>
        <SectionTitle title="Event concept" />
        <p className="max-w-prose leading-relaxed text-slate-700">{plan.summary}</p>
        <p className="mt-4 text-sm"><span className="font-medium text-slate-900">Theme:</span> {plan.theme}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <IdeaList title="Decoration ideas" items={plan.decorationIdeas} />
        <Card>
          <h3 className="mb-3 text-lg font-semibold">Venue suggestions</h3>
          <ul className="space-y-3 text-sm text-slate-700">
            {plan.venueSuggestions.map((v, i) => (
              <li key={`${i}-${v.type}`}>
                <p className="font-medium text-slate-900">{v.type}</p>
                <p className="leading-relaxed">{v.suggestion}</p>
                {typeof v.estimatedCostINR === "number" && (
                  <p className="mt-0.5 text-xs text-slate-500">Estimated cost: {formatINR(v.estimatedCostINR)} (estimate, not a quote)</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <IdeaList title="Food and catering" items={plan.foodSuggestions} />
        <IdeaList title="Entertainment and activities" items={plan.entertainmentIdeas} />
        <IdeaList title="Guest management" items={plan.guestManagementTips} />
        <IdeaList title="Ways to save money" items={plan.costSavingTips} />
      </div>
    </div>
  );
}

export function EventDayChecklist({ items }: { items: string[] }) {
  return (
    <Card id="event-day">
      <SectionTitle title="Event-day checklist" description="A quick list to run through on the day." />
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {items.map((t, i) => (
          <li key={`${i}-${t}`} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
