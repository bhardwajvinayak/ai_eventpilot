import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { EventsProvider } from "@/components/events-provider";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AI EventPilot - Smart Event Planning Assistant",
  description: "Plan weddings, birthdays, college and community events with a personalised budget, timeline and vendor checklist.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">
          Skip to content
        </a>
        <EventsProvider>
          <header className="border-b border-slate-200 bg-white print:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <Link href="/" className="flex items-center gap-2 rounded-lg text-lg font-semibold text-slate-900">
                <Compass className="h-6 w-6 text-teal-700" aria-hidden="true" />
                <span style={{ fontFamily: "Georgia, Cambria, serif" }}>AI EventPilot</span>
              </Link>
              <nav aria-label="Main" className="flex items-center gap-2">
                <Link href="/" className={buttonClass("ghost", true)}>Dashboard</Link>
                <Link href="/events/new" className={buttonClass("primary", true)}>Create new event</Link>
              </nav>
            </div>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-500 sm:px-6 print:hidden">
            All prices are planning estimates in INR, not vendor quotations. EventPilot does not contact, book or verify vendors.
          </footer>
        </EventsProvider>
      </body>
    </html>
  );
}
