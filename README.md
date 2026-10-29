# AI EventPilot - Smart Event Planning Assistant

AI EventPilot helps you plan weddings, birthday parties, college events, community events, anniversaries and other celebrations.
You answer a short form and get a personalised plan: concept and theme, decoration, venue and food ideas, a budget in rupees,
a dated preparation timeline and a vendor checklist. Everything is saved in your own browser.

## Main features

- **Dashboard** with event categories, saved events, upcoming dates, overall progress and a friendly first-time empty state.
- **Four-step event wizard** with validation, helpful examples, and back/forward navigation that keeps your answers.
- **AI plan generator** (Google Gemini, called only from the server) with a strict JSON structure that is validated before use.
- **Budget planner** with nine categories, editable amounts, instant totals, percentages, a bar chart, and an over-budget warning.
  All totals are calculated in code, never taken from the AI.
- **Timeline** counted back from the event date. Past dates and short preparation windows are handled with clear warnings
  instead of impossible deadlines.
- **Vendor checklist**: tick items, add your own, rename items, remove your own items, track progress.
  It is a to-do list only; no vendor is contacted, booked or verified.
- **Saved events** in `localStorage` with safe parsing and recovery from corrupted data. Delete asks for confirmation.
- **Print** (browser print dialog) and **JSON export/import** with validation. There is no PDF export; use "Save as PDF" in the print dialog if you want one.
- **Demo mode** when no API key is set (see below).

## Technology stack

Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3, Zod, Lucide icons, and Node's built-in test runner (run through `tsx`).
There is no database, Docker, authentication or paid service.

## Folder structure

```
app/
  layout.tsx, page.tsx, globals.css, error.tsx, not-found.tsx
  events/new/page.tsx        create-event wizard
  events/[id]/page.tsx       event plan, budget, timeline, vendors
  api/generate-plan/route.ts server-side AI endpoint
components/
  ui/ dashboard/ events/ budget/ timeline/ vendors/
lib/
  schemas.ts   Zod schemas and types      budget.ts     budget maths
  ai.ts        Gemini call and parsing    timeline.ts   date maths
  generate.ts  request handler            storage.ts    localStorage, export, import
  demo-plans.ts local sample plans        plan.ts, form.ts, utils.ts
types/event.ts
tests/         automated tests
.env.example   safe template (no real key)
```

## Prerequisites

- Node.js 20.9 or newer (22 LTS recommended) and npm
- A modern browser such as Chrome

## Installation

```bash
npm install
```

## Environment variables

1. Get a free API key from Google AI Studio: https://aistudio.google.com/apikey
2. Copy the template and add your key:

   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local`:

   ```
   GEMINI_API_KEY=paste_your_key_here
   GEMINI_MODEL=gemini-3.8-flash
   ```

`.env.local` is ignored by git. Never commit it and never put a key in source code. Restart the dev server after editing it.
Google renames and retires models often. If you see "model not found", open https://ai.google.dev/gemini-api/docs/pricing,
pick a current model that has a free tier, and set `GEMINI_MODEL` to its ID.

In a cloud workspace (Codespaces, Replit, Firebase Studio and similar), add `GEMINI_API_KEY` through the workspace's **secrets**
settings instead of a file.

Note: Google may use free-tier requests to improve its products. EventPilot only sends the event details you type into the form,
so do not put phone numbers, addresses or other personal data in the free-text fields.

## Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Other commands

```bash
npm test            # automated tests
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # production build
npm start           # serve the production build
```

## How demo mode works

If `GEMINI_API_KEY` is missing (or still the placeholder), the server returns a plan built locally from templates and your answers.
No AI model is called. The plan is clearly labelled "Demo mode: no AI was used" on the event page and as "Demo plan" on the dashboard.
If a key *is* set and the AI call fails (bad key, rate limit, network, malformed output), EventPilot shows the error and lets you retry.
It never silently swaps in demo data; you can choose "Use a demo plan instead" yourself.

## How secrets are protected

- The key is read from `process.env` only inside `app/api/generate-plan/route.ts` (server side).
- It is not in any `NEXT_PUBLIC_` variable, never sent to the browser, and sent to Google in a request header rather than the URL.
- Requests to the API route are validated with Zod and limited in size, and AI responses are validated before they are used.

## Current limitations

- Prices are planning estimates from a language model or local templates. They are not vendor quotations, and no vendor is contacted.
- Data lives in one browser. It does not sync between devices and is lost if browser data is cleared; export important plans.
- Editing details does not rewrite the plan text; create a new event for a fresh plan.
- The API route has no rate limiting of its own, so deploy it publicly only with that in mind.
- Free-tier model names and limits change; you may need to update `GEMINI_MODEL`.
- No PDF export, user accounts or real-time vendor data.

## Future enhancements

Vendor contact notes, shareable read-only plans, a second language (Hindi), per-category budget tracking of actual spend,
calendar (.ics) export, and rate limiting on the API route.
