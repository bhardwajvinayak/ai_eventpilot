import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, buildTimeline, daysBetween, rebaseTimeline, relativeLabel, timelineWarnings, todayISO } from "../lib/timeline";

const seeds = [
  { title: "Book venue", daysBeforeEvent: 60, priority: "high" as const },
  { title: "Send invitations", daysBeforeEvent: 21, priority: "medium" as const },
  { title: "Final checks", daysBeforeEvent: 1, priority: "high" as const },
  { title: "Event day", daysBeforeEvent: 0, priority: "high" as const },
];

test("date helpers handle month, year and leap-year boundaries", () => {
  assert.equal(daysBetween("2027-01-01", "2027-01-31"), 30);
  assert.equal(daysBetween("2027-03-01", "2027-02-01"), -28);
  assert.equal(addDays("2027-03-01", -1), "2027-02-28");
  assert.equal(addDays("2028-03-01", -1), "2028-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(todayISO(new Date(2027, 0, 5, 23, 59)), "2027-01-05");
});

test("a far-future event gets exact relative deadlines with no warnings", () => {
  const items = buildTimeline(seeds, "2027-06-30", "2027-01-01");
  assert.deepEqual(items.map((i) => i.dueDate), ["2027-05-01", "2027-06-09", "2027-06-29", "2027-06-30"]);
  assert.ok(items.every((i) => !i.compressed && !i.done));
  assert.deepEqual(timelineWarnings("2027-06-30", items, "2027-01-01"), []);
});

test("a short preparation window never produces deadlines in the past, and warns", () => {
  const today = "2027-01-01";
  const items = buildTimeline(seeds, "2027-01-11", today);
  assert.ok(items.every((i) => i.dueDate >= today));
  const book = items.find((i) => i.title === "Book venue")!;
  assert.equal(book.dueDate, today);
  assert.equal(book.compressed, true);
  assert.equal(items.find((i) => i.title === "Final checks")!.compressed, false);
  const w = timelineWarnings("2027-01-11", items, today);
  assert.equal(w.length, 2);
  assert.match(w[0], /Only 10 days remain/);
  assert.match(w[1], /moved to today/);
});

test("past events keep reference dates and show a clear warning", () => {
  const items = buildTimeline(seeds, "2026-12-20", "2027-01-01");
  assert.ok(items.every((i) => !i.compressed));
  assert.equal(items.at(-1)!.dueDate, "2026-12-20");
  const w = timelineWarnings("2026-12-20", items, "2027-01-01");
  assert.equal(w.length, 1);
  assert.match(w[0], /12 days ago/);
});

test("an event today is flagged", () => {
  const items = buildTimeline(seeds, "2027-01-01", "2027-01-01");
  assert.match(timelineWarnings("2027-01-01", items, "2027-01-01")[0], /event is today/i);
});

test("tasks are sorted by date, then priority", () => {
  const items = buildTimeline(
    [
      { title: "low", daysBeforeEvent: 5, priority: "low" },
      { title: "high", daysBeforeEvent: 5, priority: "high" },
      { title: "earlier", daysBeforeEvent: 9, priority: "low" },
    ],
    "2027-06-30",
    "2027-01-01",
  );
  assert.deepEqual(items.map((i) => i.title), ["earlier", "high", "low"]);
});

test("changing the event date rebases deadlines and keeps completion state", () => {
  const items = buildTimeline(seeds, "2027-06-30", "2027-01-01");
  items[0] = { ...items[0], done: true };
  const moved = rebaseTimeline(items, "2027-08-31", "2027-01-01");
  assert.equal(moved.find((i) => i.title === "Event day")!.dueDate, "2027-08-31");
  assert.equal(moved.find((i) => i.title === "Book venue")!.done, true);
  assert.equal(moved.length, items.length);
});

test("relative labels read naturally", () => {
  assert.equal(relativeLabel("2027-01-01", "2027-01-01"), "Today");
  assert.equal(relativeLabel("2027-01-02", "2027-01-01"), "Tomorrow");
  assert.equal(relativeLabel("2027-01-10", "2027-01-01"), "In 9 days");
  assert.equal(relativeLabel("2026-12-30", "2027-01-01"), "2 days ago");
});
