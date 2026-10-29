import { defaultBudget } from "./budget";
import { formatDate, formatINR } from "./utils";
import { EVENT_TYPE_LABELS, type AiPlan, type EventForm, type EventType } from "./schemas";
import type { TimelineSeed } from "./timeline";

/**
 * DEMO MODE. These plans are assembled locally from templates and the user's inputs.
 * No AI model is called, and nothing here is a real vendor quote.
 */
export type Tier = "lean" | "standard" | "premium";

export function budgetTier(budget: number, guests: number): Tier {
  const perGuest = budget / Math.max(guests, 1);
  if (perGuest < 700) return "lean";
  if (perGuest < 3000) return "standard";
  return "premium";
}

const DEFAULT_THEME: Record<EventType, string> = {
  wedding: "Classic ivory, marigold and soft gold",
  birthday: "Bright garden party with a personal photo wall",
  college: "Campus fest with bold colour blocks and a stage backdrop",
  community: "Warm festive gathering with local flavour",
  anniversary: "Candlelit evening in soft gold and blush",
  other: "Relaxed, colourful celebration",
};

const IDEAS: Record<EventType, { decor: string[]; fun: string[]; guests: string[] }> = {
  wedding: {
    decor: ["Marigold and jasmine entrance with a welcome board", "Draped stage backdrop with warm fairy lights", "Reusable fabric canopies instead of single-use props", "Photo corner with printed family portraits"],
    fun: ["Live shehnai or acoustic set during guest arrival", "Dance floor with a DJ after the ceremony", "Mehendi and rangoli corner for guests", "Short slideshow of the couple's story"],
    guests: ["Assign a family member to greet elderly guests and seat them near the exit", "Prepare a one-page schedule for ceremonies and share it by message", "Keep a separate contact list for out-of-town guests and arrange pickups"],
  },
  birthday: {
    decor: ["Balloon arch in two or three colours from the chosen theme", "Photo wall with printed memories of the birthday person", "DIY paper bunting and table centrepieces", "A themed cake table with a simple backdrop"],
    fun: ["Two or three group games with small prizes", "Photo booth with cheap props", "Music playlist chosen by the birthday person", "A short cake-cutting moment with a toast"],
    guests: ["Share a simple invitation with start and end time so guests know when to arrive", "Ask for RSVPs a week ahead so you can fix the food count", "Keep a small kids' or quiet corner if the guest list is mixed in age"],
  },
  college: {
    decor: ["Printed banners and a stage backdrop with the event name", "Coloured light strips and cloth drapes, which are cheaper than props", "Entry arch built by a student volunteer team", "Clear directional signs for each hall or stall"],
    fun: ["Open mic or battle of bands slots", "Quiz, treasure hunt or gaming tournament", "Short DJ set to close the evening", "Stalls run by student clubs"],
    guests: ["Use an online registration sheet and send entry passes in advance", "Assign volunteer leads for registration, stage, food and cleanup", "Brief security and the admin office on timings and expected footfall"],
  },
  community: {
    decor: ["Cloth banners with the community or society name", "Flower garlands and diyas for a festive feel", "Reused decoration from earlier events, refreshed with new lights", "Clear seating zones for elders and children"],
    fun: ["Cultural performances by local children and residents", "Group games and a raffle", "A short felicitation for volunteers", "Rangoli or art competition"],
    guests: ["Share the plan in the community group with a clear RSVP date", "Assign lane or block captains to bring neighbours and manage seating", "Arrange parking guidance and an accessible entry for elders"],
  },
  anniversary: {
    decor: ["Candle and fairy-light table with fresh flowers", "A memory wall of photos from each year together", "Soft-gold balloons and a small floral arch", "Personalised table cards with short notes"],
    fun: ["A short video of messages from friends and family", "Playlist of songs from the couple's early years", "Toast speeches from two or three close people", "A couple's dance or a simple game about shared memories"],
    guests: ["Keep the guest list close so everyone can join the toast", "Ask two guests to share short speeches in advance", "Plan a quiet seating area for older relatives"],
  },
  other: {
    decor: ["Simple balloon and fabric backdrop in your chosen colours", "String lights and a few statement centrepieces", "A photo corner with a printed event title", "Clear welcome signage at the entrance"],
    fun: ["Playlist or a small live act", "One or two group activities", "Photo booth", "A short welcome speech and toast"],
    guests: ["Share a clear invitation with date, time and location pin", "Collect RSVPs a week ahead", "Assign one friend or family member as the point of contact on the day"],
  },
};

const SEEDS: Record<"long" | "medium" | "short", Array<[string, number, TimelineSeed["priority"]]>> = {
  long: [
    ["Fix total budget and draft the guest list", 180, "high"],
    ["Shortlist and book the venue", 150, "high"],
    ["Research caterers, decorators and photographers", 120, "medium"],
    ["Book caterer and photographer", 90, "high"],
    ["Finalise theme and decoration plan", 75, "medium"],
    ["Design and print invitations", 60, "medium"],
    ["Send invitations", 45, "high"],
    ["Arrange guest transport and stay", 30, "medium"],
    ["Do a menu tasting and confirm the menu", 21, "medium"],
    ["Collect RSVPs and confirm the final guest count", 14, "high"],
    ["Confirm every vendor in writing", 7, "high"],
    ["Do a final venue walkthrough", 2, "medium"],
    ["Run the event-day checklist", 0, "high"],
  ],
  medium: [
    ["Fix total budget and draft the guest list", 60, "high"],
    ["Shortlist and book the venue", 50, "high"],
    ["Research caterer, decorator and photographer", 40, "medium"],
    ["Book the key vendors", 30, "high"],
    ["Finalise theme and decoration plan", 25, "medium"],
    ["Send invitations", 21, "high"],
    ["Arrange transport and sound or stage needs", 14, "medium"],
    ["Confirm the final guest count and menu", 7, "high"],
    ["Confirm every vendor in writing", 4, "high"],
    ["Do a final venue walkthrough", 1, "medium"],
    ["Run the event-day checklist", 0, "high"],
  ],
  short: [
    ["Fix total budget and draft the guest list", 30, "high"],
    ["Pick and book the venue", 25, "high"],
    ["Choose the theme and decoration plan", 21, "medium"],
    ["Book the caterer or order food and cake", 18, "high"],
    ["Send invitations", 14, "high"],
    ["Order decoration and props", 10, "medium"],
    ["Confirm the final guest count", 5, "high"],
    ["Confirm vendors and delivery times", 2, "high"],
    ["Run the event-day checklist", 0, "high"],
  ],
};

const FOOD_BY_PREFERENCE: Record<EventForm["foodPreference"], string> = {
  Vegetarian: "Fully vegetarian menu: two starters, three mains with dal or paneer, rice or breads, and two desserts.",
  "Vegetarian and non-vegetarian": "Mixed menu with separate counters and serving utensils for vegetarian and non-vegetarian dishes.",
  "Non-vegetarian": "Non-vegetarian main course with one vegetarian option so every guest has something to eat.",
  Jain: "Jain menu prepared without root vegetables, with a caterer who can confirm separate preparation.",
  Vegan: "Vegan menu built around plant-based curries, grilled vegetables and fruit-based desserts, with labels for dairy-free dishes.",
  "No preference": "Balanced menu with vegetarian mains as the base and one or two non-vegetarian additions if the host wants them.",
};

export function generateDemoPlan(form: EventForm): AiPlan {
  const tier = budgetTier(form.budget, form.guestCount);
  const lines = defaultBudget(form.type, form.budget);
  const amt = (name: string) => lines.find((l) => l.name === name)?.amount ?? 0;
  const g = form.guestCount;
  const perGuest = Math.round(form.budget / g);
  const foodPerGuest = Math.round(amt("Food and catering") / g);
  const label = EVENT_TYPE_LABELS[form.type];
  const ideas = IDEAS[form.type];
  const venue = amt("Venue");
  const theme = form.theme || DEFAULT_THEME[form.type];

  const venueByTier = {
    lean: [
      { type: "Home, terrace or society hall", suggestion: `Lowest-cost option for ${g} guests. Check capacity, power backup and neighbour timings before fixing the date.`, estimatedCostINR: Math.round(venue * 0.4) },
      { type: "Community hall", suggestion: `Often cheaper than a banquet hall in ${form.city}. Ask what is included, such as chairs, lights and cleaning.`, estimatedCostINR: venue },
    ],
    standard: [
      { type: "Banquet hall", suggestion: `Good fit for ${g} guests with parking and power backup. Compare hall rent with and without in-house catering.`, estimatedCostINR: venue },
      { type: "Garden or lawn", suggestion: "Works well in the cooler months. Keep a tent or indoor fallback in case of rain or heat.", estimatedCostINR: Math.round(venue * 0.9) },
      { type: "Restaurant private room", suggestion: "Simplest for smaller groups since food and seating come together. Confirm the minimum spend.", estimatedCostINR: Math.round(venue * 0.7) },
    ],
    premium: [
      { type: "Premium banquet or hotel hall", suggestion: `Full-service option for ${g} guests, usually with in-house decoration and coordination.`, estimatedCostINR: venue },
      { type: "Resort or farmhouse", suggestion: "Gives you space for multiple functions and guest stays. Check distance from the city and late-night transport.", estimatedCostINR: Math.round(venue * 1.1) },
      { type: "Boutique venue", suggestion: "Distinctive setting that needs less decoration spend. Confirm capacity and noise rules.", estimatedCostINR: Math.round(venue * 0.9) },
    ],
  }[tier];

  const venues = [...venueByTier];
  if (form.venuePreference !== "No preference") {
    venues.unshift({
      type: form.venuePreference,
      suggestion: `Matches your stated preference. Compare at least three options in ${form.city} for ${g} guests and ask for written quotes.`,
      estimatedCostINR: venue,
    });
  }

  const food = [
    `Plan around ${formatINR(foodPerGuest)} per guest for food and catering. This is an estimate, not a caterer's quote.`,
    FOOD_BY_PREFERENCE[form.foodPreference],
    tier === "lean"
      ? "Keep the menu short and focused: one starter, two mains, one dessert, and a drink."
      : tier === "standard"
        ? "Buffet service with two starters, three mains, a live chaat or dosa counter and one dessert."
        : "Plated starters followed by a buffet with live counters, a dessert station and a mocktail bar.",
    form.durationHours >= 5 ? "Because the event runs several hours, add a tea and snack round in the middle." : "Keep service smooth with food opening 30 minutes after guests arrive.",
  ];
  if (form.requirements) food.push(`Share your special requirement with the caterer in writing: "${form.requirements.slice(0, 150)}".`);

  const tips = [
    `Your budget works out to about ${formatINR(perGuest)} per guest. Food is the largest line, so confirm the per-plate rate first.`,
    "Get at least three written quotes for venue, food and decoration before paying any advance.",
    tier === "lean" ? "Use reusable or DIY decoration and ask friends or family to help with setup." : "Ask vendors for package pricing: venue with catering, or decoration with lighting, is often cheaper than separate bookings.",
    "Choose a weekday or off-season date if your guests can manage it. Prices are often lower.",
    "Keep the emergency reserve untouched until the final week.",
  ];

  const seedSet = form.type === "wedding" ? SEEDS.long : form.type === "birthday" ? SEEDS.short : SEEDS.medium;

  return {
    summary: `${label} for ${g} guests in ${form.city} on ${formatDate(form.date)}, lasting about ${form.durationHours} hour${form.durationHours === 1 ? "" : "s"}. The total budget is ${formatINR(form.budget)}, or about ${formatINR(perGuest)} per guest, so the plan favours ${tier === "lean" ? "simple, low-cost choices" : tier === "standard" ? "a balanced mix of comfort and cost" : "a higher level of service and styling"}.`,
    theme,
    decorationIdeas: ideas.decor,
    venueSuggestions: venues.slice(0, 4),
    foodSuggestions: food,
    entertainmentIdeas: ideas.fun,
    guestManagementTips: [`Expect around ${Math.max(1, Math.round(g * 0.1))} to ${Math.max(2, Math.round(g * 0.15))} invited guests to drop out; confirm the final headcount with RSVPs before ordering food.`, ...ideas.guests],
    budgetCategories: lines,
    timelineTasks: seedSet.map(([title, daysBeforeEvent, priority]) => ({ title, daysBeforeEvent, priority })),
    vendorChecklist: [
      { category: "Venue", task: `Compare 3 venues for ${g} guests and get availability and rates in writing` },
      { category: "Caterer", task: `Request a quote and tasting for a ${form.foodPreference.toLowerCase()} menu` },
      { category: "Decorator", task: `Share the theme "${theme}" and ask for an itemised quote` },
      { category: "Photographer", task: "Compare portfolios and confirm hours, deliverables and delivery date" },
      { category: "Entertainment provider", task: "Check availability, equipment needs and sound limits at the venue" },
      { category: "Transport provider", task: "Arrange vehicles or parking for guests, family and vendors if needed" },
      { category: "Invitation or printing service", task: "Finalise the invitation text and order printing or share a digital invite" },
    ],
    costSavingTips: tips,
    eventDayChecklist: [
      "Reach the venue early and walk through every area",
      "Confirm each vendor has arrived and knows the schedule",
      "Check power, lights, sound and seating",
      "Keep the final guest list and a printed schedule at the entrance",
      "Keep a small emergency kit: tape, scissors, safety pins, first aid",
      "Assign one person to handle vendor payments and questions",
      "Take photos of the setup before guests arrive",
      "Confirm food is on time and labelled by dietary type",
      "Arrange cleanup and return of rented items",
      "Collect gifts, decorations and personal items before leaving",
    ],
  };
}
