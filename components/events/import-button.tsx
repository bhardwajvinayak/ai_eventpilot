"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/primitives";
import { useEvents } from "@/components/events-provider";
import { MAX_IMPORT_BYTES, parseImportedEvent } from "@/lib/storage";

export function ImportButton() {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { saveEvent } = useEvents();
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_IMPORT_BYTES) return setError("This file is too large to be an EventPilot export.");
    let text: string;
    try {
      text = await file.text();
    } catch {
      return setError("The file could not be read.");
    }
    const r = parseImportedEvent(text);
    if (!r.ok) return setError(r.error);
    saveEvent(r.event);
    router.push(`/events/${r.event.id}`);
  }

  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose an exported plan file"
        onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }}
      />
      <Button variant="secondary" onClick={() => input.current?.click()}>
        <Upload className="h-4 w-4" aria-hidden="true" /> Import plan
      </Button>
      {error && <Notice tone="error" title="Import failed">{error}</Notice>}
    </div>
  );
}
