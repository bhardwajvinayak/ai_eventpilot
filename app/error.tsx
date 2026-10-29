"use client";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/primitives";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <Notice
        tone="error"
        title="Something went wrong on this page"
        actions={<Button onClick={reset}>Try again</Button>}
      >
        {error.message || "An unexpected error occurred."} Your saved events in this browser are not affected.
      </Notice>
    </div>
  );
}
