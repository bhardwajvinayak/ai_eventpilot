import { Suspense } from "react";
import { EventWizard } from "@/components/events/event-wizard";

export const metadata = { title: "Create a new event - AI EventPilot" };

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-semibold">Create a new event</h1>
      <p className="mb-6 text-slate-600">Answer a few questions and EventPilot will draft a plan with a budget, timeline and vendor checklist.</p>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading the form...</p>}>
        <EventWizard />
      </Suspense>
    </div>
  );
}
