"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SavedEvent } from "@/lib/schemas";
import { getBrowserStorage, loadEvents, removeEvent, saveEvents, upsertEvent, type LoadStatus, type StorageLike } from "@/lib/storage";

type Status = LoadStatus | "loading";
type Ctx = {
  events: SavedEvent[];
  status: Status;
  /** Number of stored items that were unreadable and skipped on load. */
  dropped: number;
  saveEvent: (ev: SavedEvent) => boolean;
  deleteEvent: (id: string) => void;
};

const EventsContext = createContext<Ctx | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [dropped, setDropped] = useState(0);
  const storage = useRef<StorageLike | null>(null);
  const latest = useRef<SavedEvent[]>([]);

  useEffect(() => {
    storage.current = getBrowserStorage();
    const r = loadEvents(storage.current);
    latest.current = r.events;
    setEvents(r.events);
    setStatus(r.status);
    setDropped(r.dropped);
  }, []);

  const commit = useCallback((next: SavedEvent[]) => {
    latest.current = next;
    setEvents(next);
    const ok = saveEvents(storage.current, next);
    if (!ok) setStatus("unavailable");
    return ok;
  }, []);

  const saveEvent = useCallback(
    (ev: SavedEvent) => commit(upsertEvent(latest.current, { ...ev, updatedAt: new Date().toISOString() })),
    [commit],
  );
  const deleteEvent = useCallback((id: string) => void commit(removeEvent(latest.current, id)), [commit]);

  const value = useMemo(() => ({ events, status, dropped, saveEvent, deleteEvent }), [events, status, dropped, saveEvent, deleteEvent]);
  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): Ctx {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used inside EventsProvider");
  return ctx;
}
