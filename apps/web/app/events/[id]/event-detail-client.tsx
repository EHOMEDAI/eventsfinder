"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { Event } from "../../../lib/types";
import { useAuth } from "../../../components/auth-provider";
import { formatDateRange } from "../../../lib/format";

export function EventDetailClient({ id }: { id: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isBookmarked, setBookmarked] = useState(false);
  const [hasBooked, setHasBooked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { token, hydrated } = useAuth();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await api.getEvent(id, token);
        setEvent(response.event);
        setBookmarked(response.isBookmarked);
        setHasBooked(response.hasBooked);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to load event.");
      } finally {
        setLoading(false);
      }
    }

    if (hydrated) {
      load();
    }
  }, [hydrated, id, token]);

  async function handleBookmark() {
    if (!token || !event) {
      setError("Please log in before bookmarking an event.");
      return;
    }

    try {
      if (isBookmarked) {
        await api.removeBookmark(event.id, token);
        setBookmarked(false);
        setMessage("Bookmark removed.");
      } else {
        await api.bookmarkEvent(event.id, token);
        setBookmarked(true);
        setMessage("Added to bookmarks.");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Action failed.");
    }
  }

  async function handleBooking() {
    if (!token || !event) {
      setError("Please log in before joining an event.");
      return;
    }

    try {
      await api.bookEvent(event.id, token);
      setHasBooked(true);
      setMessage("RSVP confirmed.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "RSVP failed.");
    }
  }

  if (loading) {
    return <div className="message">Loading event details...</div>;
  }

  if (error && !event) {
    return <div className="message status-danger">{error}</div>;
  }

  if (!event) {
    return <div className="message">Event not found.</div>;
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      {message ? <div className="message status-success">{message}</div> : null}
      {error && event ? <div className="message status-danger">{error}</div> : null}

      <div className="detail-cover">
        <Image
          src={event.bannerUrl ?? "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"}
          alt={event.title}
          width={1400}
          height={780}
        />
      </div>

      <div className="detail-layout">
        <section className="panel stack">
          <div className="inline-actions">
            <span className="eyebrow">{event.category}</span>
            <span className="badge">{event.source === "EXTERNAL" ? "Externally Synced" : "Internal Event"}</span>
          </div>
          <h1 style={{ margin: 0 }}>{event.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {formatDateRange(event.startsAt, event.endsAt)}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {event.venue} · {event.address} · {event.city}
          </p>
          <p style={{ margin: 0 }}>{event.description}</p>
        </section>

        <aside className="panel stack">
          <div className="list-item">
            <strong>{event.isFree ? "Free RSVP" : `S$${event.price ?? 0}`}</strong>
            <span className="muted">Bookmarks {event.favouriteCount} · RSVPs {event.bookingCount}</span>
          </div>
          <div className="stack">
            <button type="button" className="button" onClick={handleBooking} disabled={hasBooked}>
              {hasBooked ? "Already Joined" : "Join Event"}
            </button>
            <button type="button" className="button-subtle" onClick={handleBookmark}>
              {isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
