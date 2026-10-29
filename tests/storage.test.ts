import { test } from "node:test";
import assert from "node:assert/strict";
import { BACKUP_KEY, STORAGE_KEY, getBrowserStorage, loadEvents, removeEvent, saveEvents, upsertEvent, type StorageLike } from "../lib/storage";
import { eventProgress } from "../lib/plan";
import { makeEvent } from "./fixtures";

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

test("unavailable storage (null) is reported, not thrown", () => {
  assert.deepEqual(loadEvents(null), { events: [], status: "unavailable", dropped: 0 });
  assert.equal(saveEvents(null, [makeEvent()]), false);
  assert.equal(getBrowserStorage(), null); // no window in Node
});

test("storage that throws on read or write is handled", () => {
  const broken: StorageLike = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("quota"); },
    removeItem: () => undefined,
  };
  assert.equal(loadEvents(broken).status, "unavailable");
  assert.equal(saveEvents(broken, [makeEvent()]), false);
});

test("empty storage loads as an empty list", () => {
  assert.deepEqual(loadEvents(fakeStorage()), { events: [], status: "ok", dropped: 0 });
});

test("events survive a save and load round trip", () => {
  const s = fakeStorage();
  const ev = makeEvent();
  assert.equal(saveEvents(s, [ev]), true);
  const r = loadEvents(s);
  assert.equal(r.status, "ok");
  assert.deepEqual(r.events, [ev]);
});

test("corrupted JSON is recovered from: empty list, raw data backed up", () => {
  const s = fakeStorage({ [STORAGE_KEY]: "{not json" });
  const r = loadEvents(s);
  assert.equal(r.status, "recovered");
  assert.deepEqual(r.events, []);
  assert.equal(s.data.get(BACKUP_KEY), "{not json");
});

test("valid JSON of the wrong shape is recovered from", () => {
  const s = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ hello: "world" }) });
  assert.equal(loadEvents(s).status, "recovered");
});

test("invalid items are dropped and valid ones are kept", () => {
  const good = makeEvent();
  const bad = { ...makeEvent(), budget: "oops" };
  const s = fakeStorage({ [STORAGE_KEY]: JSON.stringify([bad, good, 42, null]) });
  const r = loadEvents(s);
  assert.equal(r.status, "recovered");
  assert.equal(r.dropped, 3);
  assert.equal(r.events.length, 1);
  assert.equal(r.events[0].id, good.id);
  assert.ok(s.data.has(BACKUP_KEY));
});

test("upsert replaces by id, adds new events, and delete removes them", () => {
  const a = makeEvent();
  const b = { ...makeEvent(), id: "evt-2", updatedAt: "2027-02-01T00:00:00.000Z" };
  let list = upsertEvent([], a);
  list = upsertEvent(list, b);
  assert.deepEqual(list.map((e) => e.id), ["evt-2", "evt-1"]);
  list = upsertEvent(list, { ...a, form: { ...a.form, name: "Renamed" }, updatedAt: "2027-03-01T00:00:00.000Z" });
  assert.equal(list.length, 2);
  assert.equal(list[0].form.name, "Renamed");
  assert.deepEqual(removeEvent(list, "evt-1").map((e) => e.id), ["evt-2"]);
});

test("completion status counts timeline tasks and vendor items", () => {
  const ev = makeEvent();
  assert.equal(eventProgress(ev).percent, 0);
  const done = { ...ev, timeline: ev.timeline.map((t) => ({ ...t, done: true })), vendors: ev.vendors.map((v) => ({ ...v, done: true })) };
  const p = eventProgress(done);
  assert.equal(p.percent, 100);
  assert.equal(p.done, p.total);
});
