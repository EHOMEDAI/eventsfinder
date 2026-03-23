"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Event } from "../lib/types";
import { EventCard } from "../components/event-card";
import { SectionHeading } from "../components/section-heading";

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await api.getEvents("sort=soonest");
        setEvents(response.events);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to load events.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const featured = events.slice(0, 3);

  return (
    <div className="stack" style={{ gap: 26 }}>
      <section className="hero">
        <div className="hero-grid">
          <div className="stack">
            <span className="eyebrow">Mobile-first Web MVP</span>
            <h1>Discover local events, save favorites, and RSVP fast.</h1>
            <p style={{ margin: 0, maxWidth: 680 }}>
              A course-delivery MVP covering sign-up, sign-in, event discovery, search and filters, bookmarks, free RSVP, and a lightweight admin panel.
            </p>
            <div className="inline-actions">
              <a href="/search" className="button">
                Start Exploring
              </a>
              <a href="/admin" className="button-subtle">
                Open Admin Panel
              </a>
            </div>
          </div>
          <div className="stats-grid">
            <div className="card">
              <span className="muted">Featured now</span>
              <h3 style={{ marginBottom: 0 }}>{events.length || "-"}</h3>
            </div>
            <div className="card">
              <span className="muted">Filter dimensions</span>
              <h3 style={{ marginBottom: 0 }}>Category / Free / Source</h3>
            </div>
            <div className="card">
              <span className="muted">Demo roles</span>
              <h3 style={{ marginBottom: 0 }}>USER / ADMIN</h3>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="message status-danger">{error}</div> : null}
      {loading ? <div className="message">Loading featured events...</div> : null}

      <section className="stack">
        <SectionHeading title="Featured Events" description="The landing page stays focused on the highest-value flow for demos and reviews." />
        <div className="cards-grid">
          {featured.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
