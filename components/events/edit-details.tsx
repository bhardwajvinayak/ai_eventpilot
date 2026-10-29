"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { EventFields } from "@/components/events/event-fields";
import { draftFromForm, FIELD_KEYS, validateDraft, type Draft, type FieldErrors, type FieldKey } from "@/lib/form";
import type { EventForm } from "@/lib/schemas";

export function EditDetails({ form, onSave, onCancel }: { form: EventForm; onSave: (f: EventForm) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => draftFromForm(form));
  const [errors, setErrors] = useState<FieldErrors>({});

  function submit() {
    const v = validateDraft(draft);
    if (!v.ok) return setErrors(v.errors);
    onSave(v.form);
  }

  return (
    <Card>
      <SectionTitle title="Edit event details" />
      <div className="mb-5">
        <Notice tone="info">
          Saving updates your details, shifts timeline deadlines if you change the date, and recalculates the budget comparison. It does not rewrite the plan text; create a new event for a fresh plan.
        </Notice>
      </div>
      <EventFields
        keys={FIELD_KEYS}
        draft={draft}
        errors={errors}
        idPrefix="edit"
        onChange={(k: FieldKey, v: string) => { setDraft((d) => ({ ...d, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); }}
      />
      <div className="mt-6 flex gap-3">
        <Button onClick={submit}>Save changes</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}
