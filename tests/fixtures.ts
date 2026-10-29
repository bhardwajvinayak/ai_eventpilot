import { eventFormSchema, type EventForm, type SavedEvent } from "../lib/schemas";
import { generateDemoPlan } from "../lib/demo-plans";
import { buildSavedEvent } from "../lib/plan";

export const rawForm = {
  name: "Aarav's 10th Birthday",
  type: "birthday",
  date: "2027-03-20",
  city: "Meerut",
  guestCount: "30",
  budget: "15000",
  durationHours: "4",
  theme: "Space adventure",
  foodPreference: "Vegetarian",
  venuePreference: "Home or terrace",
  requirements: "Two guests have nut allergies",
};

export function makeForm(overrides: Partial<Record<keyof typeof rawForm, string | number>> = {}): EventForm {
  return eventFormSchema.parse({ ...rawForm, ...overrides });
}

export function makeEvent(overrides: Partial<Record<keyof typeof rawForm, string | number>> = {}, today = "2027-01-01"): SavedEvent {
  const form = makeForm(overrides);
  return buildSavedEvent({ form, plan: generateDemoPlan(form), source: "demo", today, id: "evt-1", now: "2027-01-01T00:00:00.000Z" });
}
