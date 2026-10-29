import { test } from "node:test";
import assert from "node:assert/strict";
import { BUDGET_CATEGORY_NAMES, DEFAULT_SPLITS, allocate, defaultBudget, reconcileBudget, setLineAmount, summarizeBudget } from "../lib/budget";
import { EVENT_TYPES } from "../lib/schemas";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

test("every default split adds up to 100 percent", () => {
  for (const t of EVENT_TYPES) assert.equal(sum(DEFAULT_SPLITS[t]), 100, t);
});

test("allocate always adds up to exactly the total, even for awkward numbers", () => {
  for (const total of [1, 7, 999, 15000, 100001, 500000, 1234567]) {
    assert.equal(sum(allocate(total, [20, 12, 32, 10, 8, 3, 4, 3, 8])), total);
  }
  assert.deepEqual(allocate(100, [0, 0]), [0, 0]);
});

test("default budgets cover all nine categories and match the total", () => {
  for (const t of EVENT_TYPES) {
    const lines = defaultBudget(t, 123457);
    assert.deepEqual(lines.map((l) => l.name), [...BUDGET_CATEGORY_NAMES]);
    assert.equal(sum(lines.map((l) => l.amount)), 123457);
  }
});

test("summary totals, remaining budget and percentages are consistent", () => {
  const lines = defaultBudget("wedding", 500000);
  const s = summarizeBudget(lines, 500000);
  assert.equal(s.totalEstimated, 500000);
  assert.equal(s.remaining, 0);
  assert.equal(s.overBudget, false);
  assert.equal(s.deficit, 0);
  assert.equal(sum(s.rows.map((r) => r.amount)), s.totalEstimated);
  assert.ok(Math.abs(sum(s.rows.map((r) => r.percent)) - 100) < 0.6);
});

test("budget overrun is detected and the deficit is reported", () => {
  const lines = setLineAmount(defaultBudget("birthday", 15000), "Venue", 9000);
  const s = summarizeBudget(lines, 15000);
  assert.equal(s.overBudget, true);
  assert.equal(s.deficit, s.totalEstimated - 15000);
  assert.equal(s.remaining, -s.deficit);
});

test("spending less than the budget leaves a positive remainder and is not an overrun", () => {
  const lines = setLineAmount(defaultBudget("birthday", 15000), "Venue", 0);
  const s = summarizeBudget(lines, 15000);
  assert.equal(s.overBudget, false);
  assert.ok(s.remaining > 0);
});

test("editing one category recalculates totals instantly and rejects bad numbers", () => {
  const base = defaultBudget("community", 50000);
  const edited = setLineAmount(base, "Transport", 12000);
  const before = summarizeBudget(base, 50000).totalEstimated;
  const after = summarizeBudget(edited, 50000).totalEstimated;
  assert.equal(after - before, 12000 - base.find((l) => l.name === "Transport")!.amount);
  assert.equal(setLineAmount(base, "Venue", -5).find((l) => l.name === "Venue")!.amount, 0);
  assert.equal(setLineAmount(base, "Venue", "abc").find((l) => l.name === "Venue")!.amount, 0);
  assert.equal(setLineAmount(base, "Venue", 1234.6).find((l) => l.name === "Venue")!.amount, 1235);
});

test("AI budgets are rescaled in code so allocations match the user's budget", () => {
  const ai = [
    { name: "Venue / Hall rental", amount: 40000 },
    { name: "Food & Catering", amount: 90000 },
    { name: "Decor and flowers", amount: 30000 },
    { name: "Photo & video", amount: 25000 },
    { name: "Music and DJ", amount: 15000 },
    { name: "Random extras", amount: 5000 },
    { name: "Contingency", amount: -999 },
  ];
  const lines = reconcileBudget(ai, 150000, "wedding");
  assert.equal(sum(lines.map((l) => l.amount)), 150000);
  assert.equal(lines.length, BUDGET_CATEGORY_NAMES.length);
  assert.equal(lines.find((l) => l.name === "Emergency reserve")!.amount, 0);
  assert.ok(lines.find((l) => l.name === "Food and catering")!.amount > lines.find((l) => l.name === "Venue")!.amount);
});

test("unusable AI budget numbers fall back to the default split", () => {
  const lines = reconcileBudget([{ name: "Venue", amount: Number.NaN }, { name: "Food", amount: 0 }], 80000, "college");
  assert.deepEqual(lines, defaultBudget("college", 80000));
});
