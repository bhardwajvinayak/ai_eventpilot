import { EventView } from "@/components/events/event-view";

export const metadata = { title: "Event plan - AI EventPilot" };

export default function EventPage({ params }: { params: { id: string } }) {
  return <EventView id={params.id} />;
}
