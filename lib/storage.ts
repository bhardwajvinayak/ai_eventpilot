import { exportFileSchema, savedEventSchema, type SavedEvent } from "./schemas";
import { makeId } from "./utils";

export const STORAGE_KEY = "eventpilot:events:v1";
export const BACKUP_KEY = `${STORAGE_KEY}:corrupt-backup`;
export const MAX_IMPORT_BYTES = 2_000_000;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type LoadStatus = "ok" | "recovered" | "unavailable";
export type LoadResult = { events: SavedEvent[]; status: LoadStatus; dropped: number };

/** Returns localStorage if it works (it can throw in private mode or when blocked), otherwise null. */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = "__eventpilot_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function sortNewestFirst(events: SavedEvent[]): SavedEvent[] {
  return [...events].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function backup(storage: StorageLike, raw: string) {
  try {
    storage.setItem(BACKUP_KEY, raw);
  } catch {
    /* ignore: backup is best effort */
  }
}

export function loadEvents(storage: StorageLike | null): LoadResult {
  if (!storage) return { events: [], status: "unavailable", dropped: 0 };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { events: [], status: "unavailable", dropped: 0 };
  }
  if (raw === null) return { events: [], status: "ok", dropped: 0 };

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    backup(storage, raw);
    return { events: [], status: "recovered", dropped: 0 };
  }
  if (!Array.isArray(json)) {
    backup(storage, raw);
    return { events: [], status: "recovered", dropped: 0 };
  }

  const events: SavedEvent[] = [];
  for (const item of json) {
    const r = savedEventSchema.safeParse(item);
    if (r.success) events.push(r.data);
  }
  const dropped = json.length - events.length;
  if (dropped > 0) backup(storage, raw);
  return { events: sortNewestFirst(events), status: dropped > 0 ? "recovered" : "ok", dropped };
}

export function saveEvents(storage: StorageLike | null, events: SavedEvent[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(events));
    return true;
  } catch {
    return false;
  }
}

export function upsertEvent(events: SavedEvent[], ev: SavedEvent): SavedEvent[] {
  const exists = events.some((e) => e.id === ev.id);
  return sortNewestFirst(exists ? events.map((e) => (e.id === ev.id ? ev : e)) : [ev, ...events]);
}

export function removeEvent(events: SavedEvent[], id: string): SavedEvent[] {
  return events.filter((e) => e.id !== id);
}

export function exportEventJson(ev: SavedEvent, now: Date = new Date()): string {
  return JSON.stringify({ app: "ai-eventpilot", version: 1, exportedAt: now.toISOString(), event: ev }, null, 2);
}

export type ImportResult = { ok: true; event: SavedEvent } | { ok: false; error: string };

/** Validates an exported file. The imported event gets a fresh id so it never overwrites an existing plan. */
export function parseImportedEvent(text: string, now: Date = new Date()): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: "This file is too large to be an EventPilot export." };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  const r = exportFileSchema.safeParse(json);
  if (!r.success) {
    const first = r.error.issues[0];
    return { ok: false, error: `This is not a valid EventPilot export (${first.path.join(".") || "file"}: ${first.message}).` };
  }
  return { ok: true, event: { ...r.data.event, id: makeId(), updatedAt: now.toISOString() } };
}
