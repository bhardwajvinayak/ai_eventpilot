"use client";

import { Notice } from "@/components/ui/primitives";
import { useEvents } from "@/components/events-provider";

/** Always explains where data lives, and warns when storage is unavailable or was recovered. */
export function StorageNotice({ compact = false }: { compact?: boolean }) {
  const { status, dropped } = useEvents();
  return (
    <div className="space-y-3 print:hidden">
      {status === "unavailable" && (
        <Notice tone="warning" title="Browser storage is unavailable">
          Your plans will only last until you close or refresh this tab. Export important plans as JSON so you do not lose them.
        </Notice>
      )}
      {status === "recovered" && (
        <Notice tone="warning" title="Some saved data could not be read">
          {dropped > 0 ? `${dropped} saved item${dropped === 1 ? " was" : "s were"} skipped because ${dropped === 1 ? "it was" : "they were"} damaged.` : "Saved data was damaged and has been reset."} A backup of the original was kept in this browser.
        </Notice>
      )}
      {!compact && (
        <p className="text-sm text-slate-600">
          Plans are saved in this browser only. They do not sync across devices and may be lost if you clear your browser data. Use Export to keep a copy.
        </p>
      )}
    </div>
  );
}
