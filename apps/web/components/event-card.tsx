import Link from "next/link";
import Image from "next/image";
import type { Event } from "../lib/types";
import { formatDateRange } from "../lib/format";

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="event-card">
      <Image
        src={event.bannerUrl ?? "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"}
        alt={event.title}
        width={1200}
        height={720}
      />
      <div className="event-card-body">
        <div className="inline-actions">
          <span className="eyebrow">{event.category}</span>
          <span className="badge">{event.isFree ? "Free RSVP" : `S$${event.price ?? 0}`}</span>
        </div>
        <div className="stack">
          <h3 style={{ margin: 0 }}>{event.title}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {formatDateRange(event.startsAt, event.endsAt)}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {event.venue} · {event.city}
          </p>
        </div>
        <div className="inline-actions">
          <Link href={`/events/${event.id}`} className="button-subtle">
            View Details
          </Link>
          <span className="muted">{event.source === "EXTERNAL" ? "External Sync" : "Internal Event"}</span>
        </div>
      </div>
    </article>
  );
}
