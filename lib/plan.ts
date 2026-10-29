import { reconcileBudget } from "./budget";
import { buildTimeline } from "./timeline";
import { makeId } from "./utils";
import type { AiPlan, EventForm, PlanContent, SavedEvent } from "./schemas";

export function contentFromPlan(plan: AiPlan): PlanContent {
  return {
    summary: plan.summary,
    theme: plan.theme,
    decorationIdeas: plan.decorationIdeas,
    venueSuggestions: plan.venueSuggestions,
    foodSuggestions: plan.foodSuggestions,
    entertainmentIdeas: plan.entertainmentIdeas,
    guestManagementTips: plan.guestManagementTips,
    costSavingTips: plan.costSavingTips,
    eventDayChecklist: plan.eventDayChecklist,
  };
}

/** Combines the form and a validated plan into a saved event. Budget and dates are computed here, not by the AI. */
export function buildSavedEvent(input: {
  form: EventForm;
  plan: AiPlan;
  source: "ai" | "demo";
  model?: string;
  today?: string;
  id?: string;
  now?: string;
}): SavedEvent {
  const { form, plan, source } = input;
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? makeId(),
    form,
    source,
    ...(input.model ? { model: input.model } : {}),
    plan: contentFromPlan(plan),
    budget: reconcileBudget(plan.budgetCategories, form.budget, form.type),
    timeline: buildTimeline(plan.timelineTasks, form.date, input.today),
    vendors: plan.vendorChecklist.map((v, i) => ({
      id: `vendor-${i + 1}`,
      category: v.category,
      title: v.task,
      done: false,
      custom: false,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function eventProgress(ev: SavedEvent): { done: number; total: number; percent: number } {
  const all = [...ev.timeline, ...ev.vendors];
  const done = all.filter((x) => x.done).length;
  return { done, total: all.length, percent: all.length ? Math.round((done / all.length) * 100) : 0 };
}
