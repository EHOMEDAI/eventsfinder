"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-provider";
import { api } from "../../lib/api";
import type { Event } from "../../lib/types";
import { EventCard } from "../../components/event-card";
import { SectionHeading } from "../../components/section-heading";

export default function BookmarksPage() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const accessToken = token;

    async function load() {
      setLoading(true);
      try {
        const response = await api.getBookmarks(accessToken);
        setEvents(response.events);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to load bookmarks.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hydrated, router, token]);

  return (
    <div className="stack">
      <SectionHeading title="My Bookmarks" description="This keeps the bookmark flow visible for personalized event discovery demos." />
      {loading ? <div className="message">Loading bookmarks...</div> : null}
      {error ? <div className="message status-danger">{error}</div> : null}
      {!loading && !events.length ? <div className="message">You have not bookmarked any events yet.</div> : null}
      <div className="cards-grid">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
