import { EVENT_TYPES, eventFormSchema, type EventForm } from "./schemas";

export const FIELD_KEYS = [
  "name", "type", "date", "city", "guestCount", "budget", "durationHours",
  "theme", "foodPreference", "venuePreference", "requirements",
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];
/** Form state while the user is typing: every value is a string. */
export type Draft = Record<FieldKey, string>;
export type FieldErrors = Partial<Record<FieldKey, string>>;

export function emptyDraft(type?: string | null): Draft {
  return {
    name: "",
    type: type && (EVENT_TYPES as readonly string[]).includes(type) ? type : "",
    date: "",
    city: "",
    guestCount: "",
    budget: "",
    durationHours: "4",
    theme: "",
    foodPreference: "No preference",
    venuePreference: "No preference",
    requirements: "",
  };
}

export function draftFromForm(f: EventForm): Draft {
  return {
    name: f.name, type: f.type, date: f.date, city: f.city,
    guestCount: String(f.guestCount), budget: String(f.budget), durationHours: String(f.durationHours),
    theme: f.theme, foodPreference: f.foodPreference, venuePreference: f.venuePreference, requirements: f.requirements,
  };
}

export function validateDraft(draft: Draft): { ok: true; form: EventForm } | { ok: false; errors: FieldErrors } {
  const r = eventFormSchema.safeParse(draft);
  if (r.success) return { ok: true, form: r.data };
  const errors: FieldErrors = {};
  for (const issue of r.error.issues) {
    const key = issue.path[0] as FieldKey;
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
