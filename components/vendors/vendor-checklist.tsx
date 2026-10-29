"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, Notice, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { cleanText, type VendorItem } from "@/lib/schemas";
import { makeId } from "@/lib/utils";

export function VendorChecklist({ items, onChange }: { items: VendorItem[]; onChange: (items: VendorItem[]) => void }) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const done = items.filter((i) => i.done).length;
  const clean = (s: string) => cleanText(s).slice(0, 200);

  function add(e: FormEvent) {
    e.preventDefault();
    const title = clean(newTitle);
    if (!title) return setError("Enter a name for the checklist item.");
    onChange([...items, { id: makeId(), category: "Custom", title, done: false, custom: true }]);
    setNewTitle("");
    setError(null);
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    const title = clean(editText);
    if (!title) return setError("The item name cannot be empty.");
    onChange(items.map((i) => (i.id === editingId ? { ...i, title } : i)));
    setEditingId(null);
    setError(null);
  }

  return (
    <Card id="vendors">
      <SectionTitle
        title="Vendor checklist"
        description="Suggested things to do for each vendor type. This is a to-do list only: EventPilot has not contacted, booked or verified any vendor."
      />
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1"><ProgressBar value={items.length ? (done / items.length) * 100 : 0} label="Vendor checklist progress" /></div>
        <span className="text-sm text-slate-600">{done} of {items.length} done</span>
      </div>

      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}

      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <input
              id={`vd-${it.id}`}
              type="checkbox"
              checked={it.done}
              onChange={() => onChange(items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))}
              className="mt-1 h-5 w-5 shrink-0 accent-teal-700"
            />
            <div className="min-w-0 flex-1">
              {editingId === it.id ? (
                <form onSubmit={saveEdit} className="flex flex-wrap gap-2">
                  <label htmlFor={`edit-${it.id}`} className="sr-only">Checklist item name</label>
                  <input id={`edit-${it.id}`} autoFocus maxLength={200} value={editText} onChange={(e) => setEditText(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-teal-600" />
                  <Button type="submit" small>Save</Button>
                  <Button small variant="secondary" onClick={() => { setEditingId(null); setError(null); }}>Cancel</Button>
                </form>
              ) : (
                <>
                  <label htmlFor={`vd-${it.id}`} className={it.done ? "text-slate-400 line-through" : "font-medium"}>{it.title}</label>
                  <div className="mt-1"><Badge tone={it.custom ? "violet" : "neutral"}>{it.category}</Badge></div>
                </>
              )}
            </div>
            {editingId !== it.id && (
              <div className="flex shrink-0 gap-1 print:hidden">
                <Button variant="ghost" small aria-label={`Edit ${it.title}`} onClick={() => { setEditingId(it.id); setEditText(it.title); setError(null); }}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                {it.custom && (
                  <Button variant="ghost" small aria-label={`Remove ${it.title}`} onClick={() => onChange(items.filter((x) => x.id !== it.id))}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-5 flex flex-wrap gap-2 print:hidden">
        <label htmlFor="new-vendor-item" className="sr-only">New checklist item</label>
        <input id="new-vendor-item" maxLength={200} placeholder="Add your own item, for example: Book a sound system" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-teal-600" />
        <Button type="submit" variant="secondary"><Plus className="h-4 w-4" aria-hidden="true" /> Add item</Button>
      </form>
    </Card>
  );
}
