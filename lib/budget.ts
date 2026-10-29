import type { BudgetLine, EventType } from "./schemas";

export const BUDGET_CATEGORY_NAMES = [
  "Venue",
  "Decoration",
  "Food and catering",
  "Photography",
  "Entertainment",
  "Invitations",
  "Transport",
  "Miscellaneous",
  "Emergency reserve",
] as const;

/** Percent split in the same order as BUDGET_CATEGORY_NAMES. Each row sums to 100. */
export const DEFAULT_SPLITS: Record<EventType, number[]> = {
  wedding: [20, 12, 32, 10, 8, 3, 4, 3, 8],
  birthday: [15, 15, 35, 5, 12, 3, 3, 4, 8],
  college: [18, 14, 25, 6, 20, 6, 3, 3, 5],
  community: [20, 10, 30, 4, 12, 8, 6, 4, 6],
  anniversary: [18, 14, 32, 10, 10, 3, 3, 3, 7],
  other: [18, 14, 32, 7, 10, 5, 4, 4, 6],
};

const MAX_AMOUNT = 1e10;

export function sanitizeAmount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n), MAX_AMOUNT);
}

/**
 * Splits `total` (rounded to whole rupees) across `weights` using the largest-remainder method,
 * so the returned integers always add up to exactly the rounded total.
 */
export function allocate(total: number, weights: number[]): number[] {
  const target = sanitizeAmount(total);
  const w = weights.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
  const sum = w.reduce((a, b) => a + b, 0);
  if (sum === 0 || target === 0) return w.map(() => 0);
  const exact = w.map((x) => (target * x) / sum);
  const floors = exact.map(Math.floor);
  let left = target - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .filter((o) => w[o.i] > 0)
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length, left--) floors[order[k].i] += 1;
  return floors;
}

export function defaultBudget(type: EventType, total: number): BudgetLine[] {
  const amounts = allocate(total, DEFAULT_SPLITS[type]);
  return BUDGET_CATEGORY_NAMES.map((name, i) => ({ name, amount: amounts[i] }));
}

const MATCHERS: Array<[(typeof BUDGET_CATEGORY_NAMES)[number], RegExp]> = [
  ["Emergency reserve", /reserve|emergency|contingen|buffer/i],
  ["Food and catering", /food|cater|menu|cake|beverage/i],
  ["Photography", /photo|video|cinema/i],
  ["Decoration", /decor|flower|lighting|setup/i],
  ["Venue", /venue|hall|location|rental/i],
  ["Entertainment", /entertain|music|dj|activit|band/i],
  ["Invitations", /invit|print|stationer/i],
  ["Transport", /transport|travel|cab|logistic/i],
];

export function matchCategory(name: string): (typeof BUDGET_CATEGORY_NAMES)[number] {
  return MATCHERS.find(([, re]) => re.test(name))?.[0] ?? "Miscellaneous";
}

/**
 * Turns whatever the AI returned into the nine standard categories and rescales them so the
 * allocations add up to exactly the user's total budget. Falls back to the default split when
 * the AI numbers are unusable.
 */
export function reconcileBudget(aiLines: Array<{ name: string; amount: number }>, total: number, type: EventType): BudgetLine[] {
  const sums = new Map<string, number>();
  for (const l of aiLines) {
    const key = matchCategory(String(l.name));
    sums.set(key, (sums.get(key) ?? 0) + sanitizeAmount(l.amount));
  }
  const weights = BUDGET_CATEGORY_NAMES.map((n) => sums.get(n) ?? 0);
  if (weights.every((x) => x === 0)) return defaultBudget(type, total);
  const amounts = allocate(total, weights);
  return BUDGET_CATEGORY_NAMES.map((name, i) => ({ name, amount: amounts[i] }));
}

export type BudgetRow = BudgetLine & { percent: number };
export type BudgetSummary = {
  totalBudget: number;
  totalEstimated: number;
  remaining: number;
  deficit: number;
  overBudget: boolean;
  rows: BudgetRow[];
};

/** All totals are computed from the same rows that are displayed, so they can never disagree. */
export function summarizeBudget(lines: BudgetLine[], totalBudget: number): BudgetSummary {
  const clean = lines.map((l) => ({ name: l.name, amount: sanitizeAmount(l.amount) }));
  const totalEstimated = clean.reduce((a, l) => a + l.amount, 0);
  const budget = sanitizeAmount(totalBudget);
  const remaining = budget - totalEstimated;
  return {
    totalBudget: budget,
    totalEstimated,
    remaining,
    deficit: Math.max(0, -remaining),
    overBudget: totalEstimated > budget,
    rows: clean.map((l) => ({
      ...l,
      percent: totalEstimated > 0 ? Math.round((l.amount / totalEstimated) * 1000) / 10 : 0,
    })),
  };
}

export function setLineAmount(lines: BudgetLine[], name: string, amount: unknown): BudgetLine[] {
  return lines.map((l) => (l.name === name ? { ...l, amount: sanitizeAmount(amount) } : l));
}
