"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Event } from "../../lib/types";
import { EventCard } from "../../components/event-card";
import { SectionHeading } from "../../components/section-heading";

export default function SearchPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    city: "",
    isFree: "",
    source: "",
    sort: "soonest"
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.set(key, value);
          }
        });
        const response = await api.getEvents(params.toString());
        setEvents(response.events);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to load events.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filters]);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <SectionHeading title="Event Search" description="Filter by keyword, category, city, pricing type, and source." />

      <section className="panel stack">
        <div className="field-grid two">
          <div className="field">
            <label>
              Keyword
              <input
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                placeholder="Search by title, venue, or description"
              />
            </label>
          </div>
          <div className="field">
            <label>
              Category
              <select
                value={filters.category}
                onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="">All categories</option>
                <option value="Networking">Networking</option>
                <option value="Wellness">Wellness</option>
                <option value="Music">Music</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
              </select>
            </label>
          </div>
          <div className="field">
            <label>
              City
              <input
                value={filters.city}
                onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
                placeholder="For example, Singapore"
              />
            </label>
          </div>
          <div className="field">
            <label>
              Pricing
              <select
                value={filters.isFree}
                onChange={(event) => setFilters((current) => ({ ...current, isFree: event.target.value }))}
              >
                <option value="">All</option>
                <option value="true">Free only</option>
                <option value="false">Paid only</option>
              </select>
            </label>
          </div>
          <div className="field">
            <label>
              Source
              <select
                value={filters.source}
                onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}
              >
                <option value="">All sources</option>
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External</option>
              </select>
            </label>
          </div>
          <div className="field">
            <label>
              Sort
              <select
                value={filters.sort}
                onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
              >
                <option value="soonest">Soonest first</option>
                <option value="latest">Latest first</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {error ? <div className="message status-danger">{error}</div> : null}
      {loading ? <div className="message">Loading events...</div> : null}
      {!loading && !events.length ? <div className="message">No events match the current filters.</div> : null}

      <div className="cards-grid">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
