"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-provider";
import { api } from "../../lib/api";
import type { Event } from "../../lib/types";
import { formatDateRange } from "../../lib/format";
import { SectionHeading } from "../../components/section-heading";

type BookingItem = {
  id: string;
  status: string;
  bookedAt: string;
  event: Event;
};

export default function BookingsPage() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
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
        const response = await api.getBookings(accessToken);
        setBookings(response.bookings);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hydrated, router, token]);

  return (
    <div className="stack">
      <SectionHeading title="My RSVPs" description="This MVP stores free RSVP records only and does not issue real tickets." />
      {loading ? <div className="message">Loading booking records...</div> : null}
      {error ? <div className="message status-danger">{error}</div> : null}
      {!loading && !bookings.length ? <div className="message">You have not joined any events yet.</div> : null}
      <div className="list">
        {bookings.map((booking) => (
          <div key={booking.id} className="list-item">
            <div className="inline-actions">
              <span className="eyebrow">{booking.status}</span>
              <span className="muted">Created on {new Date(booking.bookedAt).toLocaleString("en-US")}</span>
            </div>
            <strong>{booking.event.title}</strong>
            <span className="muted">{formatDateRange(booking.event.startsAt, booking.event.endsAt)}</span>
            <Link href={`/events/${booking.event.id}`} className="button-subtle">
              View Event
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
