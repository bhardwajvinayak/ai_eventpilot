import type { ReactNode } from "react";
import { EVENT_TYPES, EVENT_TYPE_LABELS, FOOD_OPTIONS, VENUE_OPTIONS } from "@/lib/schemas";
import type { Draft, FieldErrors, FieldKey } from "@/lib/form";
import { formatINR } from "@/lib/utils";
import { InfoTip } from "@/components/ui/primitives";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-600 aria-[invalid=true]:border-red-500";

function Field({ id, label, hint, error, tip, wide, children }: { id: string; label: string; hint?: string; error?: string; tip?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
        {label}
        {tip && <InfoTip text={tip} />}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

type Props = {
  keys: readonly FieldKey[];
  draft: Draft;
  errors: FieldErrors;
  onChange: (key: FieldKey, value: string) => void;
  idPrefix?: string;
  disabled?: boolean;
};

/** Renders the requested form fields. Shared by the creation wizard and the edit-details panel. */
export function EventFields({ keys, draft, errors, onChange, idPrefix = "f", disabled }: Props) {
  const show = (k: FieldKey) => keys.includes(k);
  const common = (k: FieldKey) => {
    const id = `${idPrefix}-${k}`;
    return {
      id,
      value: draft[k],
      disabled,
      className: inputClass,
      "aria-invalid": errors[k] ? true : undefined,
      "aria-describedby": errors[k] ? `${id}-error` : `${id}-hint`,
      onChange: (e: { target: { value: string } }) => onChange(k, e.target.value),
    } as const;
  };
  const f = (k: FieldKey) => ({ id: `${idPrefix}-${k}`, error: errors[k] });
  const budgetNumber = Number(draft.budget);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {show("name") && (
        <Field {...f("name")} label="Event name" hint="For example: Aarav's 10th birthday" wide>
          <input type="text" maxLength={80} autoComplete="off" placeholder="Aarav's 10th birthday" {...common("name")} />
        </Field>
      )}
      {show("type") && (
        <Field {...f("type")} label="Event type">
          <select {...common("type")}>
            <option value="">Choose a type</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
      )}
      {show("date") && (
        <Field {...f("date")} label="Event date" hint="Past dates are allowed, but the timeline will flag them.">
          <input type="date" {...common("date")} />
        </Field>
      )}
      {show("city") && (
        <Field {...f("city")} label="City or location" hint="For example: Meerut, or Indirapuram, Ghaziabad" wide>
          <input type="text" maxLength={80} autoComplete="off" placeholder="Meerut" {...common("city")} />
        </Field>
      )}
      {show("guestCount") && (
        <Field {...f("guestCount")} label="Estimated guest count" hint="Your best guess is fine. You can edit it later.">
          <input type="number" min={1} max={5000} inputMode="numeric" placeholder="30" {...common("guestCount")} />
        </Field>
      )}
      {show("durationHours") && (
        <Field {...f("durationHours")} label="Event duration (hours)" hint="For example: 4 for an evening party, 8 for a wedding day.">
          <input type="number" min={1} max={72} inputMode="decimal" placeholder="4" {...common("durationHours")} />
        </Field>
      )}
      {show("budget") && (
        <Field
          {...f("budget")}
          label="Total budget in ₹"
          tip="Include everything: venue, food, decoration, photography and a small reserve."
          hint={Number.isFinite(budgetNumber) && budgetNumber > 0 ? `That is ${formatINR(budgetNumber)}.` : "For example: 150000 for ₹1,50,000."}
          wide
        >
          <input type="number" min={1000} inputMode="numeric" placeholder="150000" {...common("budget")} />
        </Field>
      )}
      {show("theme") && (
        <Field {...f("theme")} label="Preferred theme or style (optional)" hint="For example: space adventure, rustic garden, minimal white and gold." wide>
          <input type="text" maxLength={100} placeholder="Space adventure" {...common("theme")} />
        </Field>
      )}
      {show("foodPreference") && (
        <Field {...f("foodPreference")} label="Food preference">
          <select {...common("foodPreference")}>{FOOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
        </Field>
      )}
      {show("venuePreference") && (
        <Field {...f("venuePreference")} label="Venue preference">
          <select {...common("venuePreference")}>{VENUE_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
        </Field>
      )}
      {show("requirements") && (
        <Field {...f("requirements")} label="Special requirements (optional)" hint="For example: wheelchair access, nut allergies, fixed venue. Please do not enter phone numbers or addresses." wide>
          <textarea rows={4} maxLength={500} placeholder="Two guests have nut allergies" {...common("requirements")} />
        </Field>
      )}
    </div>
  );
}
