import { z } from "zod";

export const EVENT_TYPES = ["wedding", "birthday", "college", "community", "anniversary", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  birthday: "Birthday party",
  college: "College event",
  community: "Community event",
  anniversary: "Anniversary",
  other: "Other celebration",
};

export const FOOD_OPTIONS = [
  "Vegetarian",
  "Vegetarian and non-vegetarian",
  "Non-vegetarian",
  "Jain",
  "Vegan",
  "No preference",
] as const;

export const VENUE_OPTIONS = [
  "Indoor hall or banquet",
  "Outdoor or garden",
  "Home or terrace",
  "Restaurant or cafe",
  "No preference",
] as const;

/** Strips control characters and angle brackets, collapses whitespace. */
export function cleanText(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F<>]/g, " ").replace(/\s+/g, " ").trim();
}

function text(min: number, max: number, label: string) {
  const tooShort = min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`;
  return z
    .string({ required_error: `${label} is required.`, invalid_type_error: `${label} must be text.` })
    .transform(cleanText)
    .pipe(z.string().min(min, tooShort).max(max, `${label} must be ${max} characters or fewer.`));
}

const isoDate = z
  .string({ required_error: "Choose an event date.", invalid_type_error: "Choose an event date." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Choose a valid date.");

export const eventFormSchema = z.object({
  name: text(2, 80, "Event name"),
  type: z.enum(EVENT_TYPES, { errorMap: () => ({ message: "Choose an event type." }) }),
  date: isoDate,
  city: text(2, 80, "City or location"),
  guestCount: z.coerce
    .number({ invalid_type_error: "Enter the number of guests." })
    .int("Use a whole number of guests.")
    .min(1, "Enter at least 1 guest.")
    .max(5000, "Up to 5,000 guests is supported."),
  budget: z.coerce
    .number({ invalid_type_error: "Enter your total budget in rupees." })
    .min(1000, "Budget must be at least ₹1,000.")
    .max(100_000_000, "Budget must be ₹10,00,00,000 or less."),
  durationHours: z.coerce
    .number({ invalid_type_error: "Enter the duration in hours." })
    .min(1, "Duration must be at least 1 hour.")
    .max(72, "Duration must be 72 hours or less."),
  theme: text(0, 100, "Theme").default(""),
  foodPreference: z.enum(FOOD_OPTIONS, { errorMap: () => ({ message: "Choose a food preference." }) }),
  venuePreference: z.enum(VENUE_OPTIONS, { errorMap: () => ({ message: "Choose a venue preference." }) }),
  requirements: text(0, 500, "Special requirements").default(""),
});
export type EventForm = z.infer<typeof eventFormSchema>;

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

const line = (max = 300) => z.string().min(1).max(max);
const lineList = (maxItems: number) => z.array(line()).min(1).max(maxItems);

/** The structure the AI model must return. Budget amounts are re-checked in application code. */
export const aiPlanSchema = z.object({
  summary: z.string().min(10).max(800),
  theme: z.string().min(2).max(200),
  decorationIdeas: lineList(10),
  venueSuggestions: z
    .array(
      z.object({
        type: line(80),
        suggestion: line(400),
        estimatedCostINR: z.coerce.number().min(0).max(1e10).optional(),
      }),
    )
    .min(1)
    .max(6),
  foodSuggestions: lineList(10),
  entertainmentIdeas: lineList(10),
  guestManagementTips: z.array(line()).max(8).default([]),
  budgetCategories: z
    .array(z.object({ name: line(60), amount: z.coerce.number().min(0).max(1e10) }))
    .min(1)
    .max(15),
  timelineTasks: z
    .array(
      z.object({
        title: line(120),
        daysBeforeEvent: z.coerce.number().int().min(0).max(730),
        priority: z.enum(PRIORITIES),
      }),
    )
    .min(3)
    .max(25),
  vendorChecklist: z.array(z.object({ category: line(60), task: line(200) })).min(3).max(20),
  costSavingTips: lineList(10),
  eventDayChecklist: lineList(20),
});
export type AiPlan = z.infer<typeof aiPlanSchema>;

export const planContentSchema = aiPlanSchema.pick({
  summary: true,
  theme: true,
  decorationIdeas: true,
  venueSuggestions: true,
  foodSuggestions: true,
  entertainmentIdeas: true,
  guestManagementTips: true,
  costSavingTips: true,
  eventDayChecklist: true,
});
export type PlanContent = z.infer<typeof planContentSchema>;

export const budgetLineSchema = z.object({ name: z.string().min(1).max(60), amount: z.number().min(0).max(1e10) });

export const timelineItemSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  daysBeforeEvent: z.number().int().min(0).max(730),
  dueDate: isoDate,
  priority: z.enum(PRIORITIES),
  done: z.boolean(),
  compressed: z.boolean(),
});

export const vendorItemSchema = z.object({
  id: z.string().min(1).max(64),
  category: z.string().min(1).max(60),
  title: z.string().min(1).max(200),
  done: z.boolean(),
  custom: z.boolean(),
});

export const savedEventSchema = z.object({
  id: z.string().min(1).max(64),
  form: eventFormSchema,
  source: z.enum(["ai", "demo"]),
  model: z.string().max(80).optional(),
  plan: planContentSchema,
  budget: z.array(budgetLineSchema).min(1).max(20),
  timeline: z.array(timelineItemSchema).max(60),
  vendors: z.array(vendorItemSchema).max(80),
  createdAt: z.string().max(40),
  updatedAt: z.string().max(40),
});
export type SavedEvent = z.infer<typeof savedEventSchema>;
export type TimelineItem = z.infer<typeof timelineItemSchema>;
export type VendorItem = z.infer<typeof vendorItemSchema>;
export type BudgetLine = z.infer<typeof budgetLineSchema>;

export const exportFileSchema = z.object({
  app: z.literal("ai-eventpilot"),
  version: z.literal(1),
  exportedAt: z.string().max(40),
  event: savedEventSchema,
});

export const generateRequestSchema = z.object({
  form: eventFormSchema,
  /** Explicit opt-in to a locally generated sample plan. */
  demo: z.boolean().optional(),
});
