"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Two-step delete: the first click asks for confirmation, the second performs the deletion. */
export function DeleteEventButton({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="secondary" small onClick={() => setAsking(true)} aria-label={`Delete ${name}`}>
        <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
      </Button>
    );
  }
  return (
    <span role="group" aria-label={`Confirm deleting ${name}`} className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-red-800">Delete this event for good?</span>
      <Button variant="danger" small onClick={onConfirm}>Yes, delete</Button>
      <Button variant="secondary" small onClick={() => setAsking(false)} autoFocus>Keep it</Button>
    </span>
  );
}
