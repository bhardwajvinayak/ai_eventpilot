import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { generateDemoPlan, budgetTier } from "../lib/demo-plans";
import { DEMO_NOTICE, handleGenerate, isKeyConfigured } from "../lib/generate";
import { buildSavedEvent } from "../lib/plan";
import { aiPlanSchema } from "../lib/schemas";
import { summarizeBudget } from "../lib/budget";
import { POST } from "../app/api/generate-plan/route";
import { makeForm, rawForm } from "./fixtures";

const originalKey = process.env.GEMINI_API_KEY;
afterEach(() => {
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
});

const post = (body: unknown) => JSON.stringify(body);
const bd = makeForm();
const wedding = makeForm({ name: "Priya and Rohan", type: "wedding", date: "2027-11-20", guestCount: 300, budget: 500000, durationHours: 8, theme: "", foodPreference: "Vegetarian and non-vegetarian", venuePreference: "Outdoor or garden", requirements: "" });

test("demo plans are valid and personalised to the event", () => {
  const a = generateDemoPlan(bd);
  const b = generateDemoPlan(wedding);
  assert.ok(aiPlanSchema.safeParse(a).success);
  assert.ok(aiPlanSchema.safeParse(b).success);
  assert.match(a.summary, /30 guests/);
  assert.match(b.summary, /300 guests/);
  assert.match(a.summary, /₹15,000/);
  assert.match(b.summary, /₹5,00,000/);
  assert.equal(a.theme, "Space adventure");
  assert.notEqual(a.summary, b.summary);
  assert.notDeepEqual(a.venueSuggestions.map((v) => v.type), b.venueSuggestions.map((v) => v.type));
  assert.ok(b.timelineTasks.some((t) => t.daysBeforeEvent >= 150), "weddings need a long runway");
  assert.ok(a.timelineTasks.every((t) => t.daysBeforeEvent <= 30), "birthdays need a short runway");
  assert.ok(a.foodSuggestions.some((f) => f.includes("nut allergies")));
});

test("budget tiers follow budget per guest", () => {
  assert.equal(budgetTier(15000, 30), "lean");
  assert.equal(budgetTier(500000, 300), "standard");
  assert.equal(budgetTier(2000000, 200), "premium");
});

test("saved demo events have budgets that add up to the user's budget and are labelled as demo", () => {
  const ev = buildSavedEvent({ form: wedding, plan: generateDemoPlan(wedding), source: "demo", today: "2027-01-01" });
  assert.equal(ev.source, "demo");
  assert.equal(ev.model, undefined);
  const s = summarizeBudget(ev.budget, wedding.budget);
  assert.equal(s.totalEstimated, 500000);
  assert.equal(s.overBudget, false);
  assert.equal(ev.vendors.length, 7);
  assert.ok(ev.vendors.every((v) => !v.done && !v.custom));
});

test("key detection ignores empty and placeholder values", () => {
  assert.equal(isKeyConfigured(undefined), false);
  assert.equal(isKeyConfigured("  "), false);
  assert.equal(isKeyConfigured("your_api_key_here"), false);
  assert.equal(isKeyConfigured("abc123"), true);
});

test("without an API key the handler returns a clearly labelled demo plan and never calls the network", async () => {
  let called = false;
  const r = await handleGenerate(post({ form: rawForm }), {}, (async () => { called = true; return new Response("{}"); }) as typeof fetch);
  assert.equal(r.status, 200);
  assert.equal(r.body.source, "demo");
  assert.equal(r.body.notice, DEMO_NOTICE);
  assert.equal(r.body.reason, "no_api_key");
  assert.equal(r.body.model, undefined);
  assert.equal(called, false);
});

test("demo can be requested explicitly even when a key exists", async () => {
  let called = false;
  const r = await handleGenerate(post({ form: rawForm, demo: true }), { GEMINI_API_KEY: "k" }, (async () => { called = true; return new Response("{}"); }) as typeof fetch);
  assert.equal(r.body.source, "demo");
  assert.equal(r.body.reason, "requested");
  assert.equal(called, false);
});

test("the route handler works end to end in demo mode", async () => {
  delete process.env.GEMINI_API_KEY;
  const res = await POST(new Request("http://localhost/api/generate-plan", { method: "POST", body: post({ form: rawForm }) }));
  assert.equal(res.status, 200);
  const json = (await res.json()) as { source: string; plan: unknown };
  assert.equal(json.source, "demo");
  assert.ok(aiPlanSchema.safeParse(json.plan).success);
});

test("invalid requests are rejected with 400 and field-level issues", async () => {
  const r1 = await handleGenerate("not json", {});
  assert.equal(r1.status, 400);
  const r2 = await handleGenerate(post({ form: { ...rawForm, guestCount: 0, budget: 10 } }), {});
  assert.equal(r2.status, 400);
  const issues = (r2.body.error as { issues: Array<{ path: string }> }).issues.map((i) => i.path);
  assert.ok(issues.includes("form.guestCount") && issues.includes("form.budget"));
  const r3 = await handleGenerate("x".repeat(25000), {});
  assert.equal(r3.status, 413);
});

// ---- live-mode behaviour, tested against a mocked Gemini endpoint (no real API call is made) ----

const geminiReply = (text: string, status = 200) =>
  (async () => new Response(JSON.stringify(status === 200 ? { candidates: [{ content: { parts: [{ text }] } }] } : { error: { message: text } }), { status })) as typeof fetch;

test("with an API key the handler calls Gemini with the key in a header and validates the reply", async () => {
  let seenUrl = "";
  let seenHeaders: Record<string, string> = {};
  const plan = generateDemoPlan(bd);
  const f = (async (url: string, init: RequestInit) => {
    seenUrl = url;
    seenHeaders = init.headers as Record<string, string>;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(plan) }] } }] }));
  }) as unknown as typeof fetch;
  const r = await handleGenerate(post({ form: rawForm }), { GEMINI_API_KEY: "SECRET-KEY", GEMINI_MODEL: "test-model" }, f);
  assert.equal(r.status, 200);
  assert.equal(r.body.source, "ai");
  assert.equal(r.body.model, "test-model");
  assert.ok(seenUrl.includes("test-model:generateContent"));
  assert.ok(!seenUrl.includes("SECRET-KEY"), "key must not appear in the URL");
  assert.equal(seenHeaders["x-goog-api-key"], "SECRET-KEY");
  assert.ok(!JSON.stringify(r.body).includes("SECRET-KEY"));
});

test("API failures return clear errors and never fall back silently to demo data", async () => {
  const env = { GEMINI_API_KEY: "k" };
  const cases: Array<[typeof fetch, number, string]> = [
    [geminiReply("API key not valid", 400), 500, "invalid_key"],
    [geminiReply("forbidden", 403), 500, "invalid_key"],
    [geminiReply("quota", 429), 429, "rate_limited"],
    [geminiReply("no such model", 404), 502, "upstream"],
    [geminiReply("boom", 503), 502, "upstream"],
    [geminiReply("this is not json"), 502, "malformed"],
    [geminiReply('{"summary":"too short"}'), 502, "malformed"],
    [(async () => { throw new TypeError("fetch failed"); }) as typeof fetch, 502, "network"],
    [(async () => { const e = new Error("aborted"); e.name = "AbortError"; throw e; }) as typeof fetch, 504, "timeout"],
  ];
  for (const [f, status, code] of cases) {
    const r = await handleGenerate(post({ form: rawForm }), env, f);
    assert.equal(r.status, status, code);
    assert.equal((r.body.error as { code: string }).code, code);
    assert.equal(r.body.source, undefined, "no plan may be returned on failure");
  }
});
