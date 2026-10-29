import type { Priority, TimelineItem } from "./schemas";

export type TimelineSeed = { title: string; daysBeforeEvent: number; priority: Priority };

const DAY_MS = 86_400_000;
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Today's date in the local timezone as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

function parse(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime();
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to) - parse(from)) / DAY_MS);
}

export function addDays(iso: string, n: number): string {
  return new Date(parse(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Puts a task on the calendar. If the ideal date has already passed for an upcoming event, the
 * task is moved to today and flagged as `compressed` instead of pretending the old date is valid.
 * For events already in the past, ideal dates are kept as-is for reference.
 */
function place(daysBeforeEvent: number, eventDate: string, today: string) {
  const ideal = addDays(eventDate, -daysBeforeEvent);
  const eventPassed = daysBetween(today, eventDate) < 0;
  if (!eventPassed && ideal < today) return { dueDate: today, compressed: true };
  return { dueDate: ideal, compressed: false };
}

export function sortTimeline<T extends { dueDate: string; priority: Priority }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        a.item.dueDate.localeCompare(b.item.dueDate) ||
        PRIORITY_ORDER[a.item.priority] - PRIORITY_ORDER[b.item.priority] ||
        a.index - b.index,
    )
    .map((x) => x.item);
}

export function buildTimeline(seeds: TimelineSeed[], eventDate: string, today: string = todayISO()): TimelineItem[] {
  const items = seeds.map((s, i) => ({
    id: `task-${i + 1}`,
    title: s.title,
    daysBeforeEvent: s.daysBeforeEvent,
    priority: s.priority,
    done: false,
    ...place(s.daysBeforeEvent, eventDate, today),
  }));
  return sortTimeline(items);
}

/** Recomputes due dates after the event date changes, keeping completion state. */
export function rebaseTimeline(items: TimelineItem[], eventDate: string, today: string = todayISO()): TimelineItem[] {
  return sortTimeline(items.map((t) => ({ ...t, ...place(t.daysBeforeEvent, eventDate, today) })));
}

export function timelineWarnings(eventDate: string, items: TimelineItem[], today: string = todayISO()): string[] {
  const window = daysBetween(today, eventDate);
  const warnings: string[] = [];
  if (window < 0) {
    warnings.push(
      `This event date was ${Math.abs(window)} day${Math.abs(window) === 1 ? "" : "s"} ago. Deadlines are shown relative to the event date for reference only.`,
    );
    return warnings;
  }
  if (window === 0) warnings.push("Your event is today. Focus on the high-priority and event-day tasks.");
  else if (window < 14) {
    warnings.push(`Only ${window} day${window === 1 ? "" : "s"} remain. Standard planning deadlines may already be behind you, so start with the high-priority tasks.`);
  }
  const moved = items.filter((t) => t.compressed).length;
  if (moved > 0) {
    warnings.push(
      `${moved} task${moved === 1 ? "" : "s"} would normally be due earlier than today, so ${moved === 1 ? "it was" : "they were"} moved to today. Treat those dates as targets, not guarantees.`,
    );
  }
  return warnings;
}

export function relativeLabel(dueDate: string, today: string = todayISO()): string {
  const d = daysBetween(today, dueDate);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  return d > 0 ? `In ${d} days` : `${Math.abs(d)} days ago`;
}
