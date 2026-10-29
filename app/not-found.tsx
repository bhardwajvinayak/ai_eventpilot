import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <EmptyState title="Page not found" action={<Link href="/" className={buttonClass()}>Back to dashboard</Link>}>
      We could not find that page.
    </EmptyState>
  );
}
