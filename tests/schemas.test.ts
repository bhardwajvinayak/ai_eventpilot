import { test } from "node:test";
import assert from "node:assert/strict";
import { aiPlanSchema, eventFormSchema, exportFileSchema, generateRequestSchema } from "../lib/schemas";
import { AiError, buildPrompt, parseAiPlan } from "../lib/ai";
import { generateDemoPlan } from "../lib/demo-plans";
import { exportEventJson, parseImportedEvent } from "../lib/storage";
import { makeEvent, makeForm, rawForm } from "./fixtures";

test("a valid form is accepted and number strings are converted", () => {
  const r = eventFormSchema.safeParse(rawForm);
  assert.ok(r.success);
  assert.equal(r.data.guestCount, 30);
  assert.equal(r.data.budget, 15000);
});

test("invalid form input is rejected with readable messages", () => {
  const cases: Array<[Record<string, unknown>, string]> = [
    [{ name: "" }, "name"],
    [{ name: "A" }, "name"],
    [{ type: "festival" }, "type"],
    [{ date: "2027-02-30" }, "date"],
    [{ date: "" }, "date"],
    [{ city: " " }, "city"],
    [{ guestCount: "0" }, "guestCount"],
    [{ guestCount: "abc" }, "guestCount"],
    [{ guestCount: "2.5" }, "guestCount"],
    [{ budget: "500" }, "budget"],
    [{ budget: "" }, "budget"],
    [{ durationHours: "100" }, "durationHours"],
    [{ foodPreference: "Pizza only" }, "foodPreference"],
    [{ requirements: "x".repeat(501) }, "requirements"],
  ];
  for (const [patch, field] of cases) {
    const r = eventFormSchema.safeParse({ ...rawForm, ...patch });
    assert.ok(!r.success, `${JSON.stringify(patch)} should fail`);
    assert.ok(r.error.issues.some((i) => i.path[0] === field), `expected an issue on ${field}`);
    assert.ok(r.error.issues[0].message.length > 5);
  }
});

test("form text is sanitised: tags and control characters are removed", () => {
  const f = eventFormSchema.parse({ ...rawForm, theme: "  <script>alert(1)</script>\n space  " });
  assert.ok(!/[<>]/.test(f.theme));
  assert.ok(!f.theme.includes("\n"));
});

test("optional fields default to empty strings", () => {
  const { theme, requirements, ...rest } = rawForm;
  void theme; void requirements;
  const f = eventFormSchema.parse(rest);
  assert.equal(f.theme, "");
  assert.equal(f.requirements, "");
});

test("generate request requires a valid form", () => {
  assert.ok(!generateRequestSchema.safeParse({}).success);
  assert.ok(!generateRequestSchema.safeParse({ form: { ...rawForm, budget: 1 } }).success);
  assert.ok(generateRequestSchema.safeParse({ form: rawForm, demo: true }).success);
});

test("a complete AI plan passes validation", () => {
  assert.ok(aiPlanSchema.safeParse(generateDemoPlan(makeForm())).success);
});

test("AI plans with missing or wrong-typed fields are rejected", () => {
  const good = generateDemoPlan(makeForm());
  const { summary, ...noSummary } = good;
  void summary;
  assert.ok(!aiPlanSchema.safeParse(noSummary).success);
  assert.ok(!aiPlanSchema.safeParse({ ...good, budgetCategories: [{ name: "Venue", amount: "lots" }] }).success);
  assert.ok(!aiPlanSchema.safeParse({ ...good, timelineTasks: [{ title: "a", daysBeforeEvent: -3, priority: "high" }] }).success);
  assert.ok(!aiPlanSchema.safeParse({ ...good, timelineTasks: good.timelineTasks.map((t) => ({ ...t, priority: "urgent" })) }).success);
  assert.ok(!aiPlanSchema.safeParse("not an object").success);
});

test("parseAiPlan accepts plain and code-fenced JSON and rejects malformed output", () => {
  const json = JSON.stringify(generateDemoPlan(makeForm()));
  assert.equal(parseAiPlan(json).theme.length > 0, true);
  assert.equal(parseAiPlan("```json\n" + json + "\n```").theme.length > 0, true);
  assert.equal(parseAiPlan("Here is your plan:\n" + json).theme.length > 0, true);
  for (const bad of ["", "no json here", "{ broken", '{"summary":"x"}']) {
    assert.throws(() => parseAiPlan(bad), (e: unknown) => e instanceof AiError && e.code === "malformed", bad);
  }
});

test("the prompt contains the event details, INR rules and the no-fabrication rule", () => {
  const p = buildPrompt(makeForm());
  assert.match(p, /Meerut/);
  assert.match(p, /15000/);
  assert.match(p, /INR/);
  assert.match(p, /do not invent vendor names/i);
  assert.ok(p.length < 3000, "prompt should stay short for free-tier limits");
});

test("exported events can be imported again; invalid files are rejected", () => {
  const ev = makeEvent();
  const ok = parseImportedEvent(exportEventJson(ev));
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.notEqual(ok.event.id, ev.id);
    assert.equal(ok.event.form.name, ev.form.name);
    assert.deepEqual(ok.event.budget, ev.budget);
  }
  assert.ok(!parseImportedEvent("not json").ok);
  assert.ok(!parseImportedEvent("{}").ok);
  assert.ok(!parseImportedEvent(JSON.stringify({ app: "other", version: 1, exportedAt: "x", event: ev })).ok);
  assert.ok(!exportFileSchema.safeParse({ app: "ai-eventpilot", version: 1, exportedAt: "x", event: { ...ev, budget: "x" } }).success);
});

import { draftFromForm, emptyDraft, validateDraft } from "../lib/form";

test("wizard drafts: empty drafts report every required field, valid drafts round-trip", () => {
  const empty = validateDraft(emptyDraft());
  assert.ok(!empty.ok);
  if (!empty.ok) {
    for (const k of ["name", "type", "date", "city", "guestCount", "budget"] as const) assert.ok(empty.errors[k], k);
    assert.equal(empty.errors.foodPreference, undefined);
  }
  assert.equal(emptyDraft("wedding").type, "wedding");
  assert.equal(emptyDraft("nonsense").type, "");
  const ok = validateDraft(draftFromForm(makeForm()));
  assert.ok(ok.ok);
  if (ok.ok) assert.deepEqual(ok.form, makeForm());
});
