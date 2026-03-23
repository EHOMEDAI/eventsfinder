"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-provider";
import { api } from "../../lib/api";
import type { Event, EventStatus } from "../../lib/types";
import { SectionHeading } from "../../components/section-heading";
import { formatDateRange } from "../../lib/format";

type SyncLog = {
  id: string;
  provider: string;
  status: string;
  message: string;
  importedCount: number;
  syncedAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const { token, account, hydrated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    if (!account?.roles.includes("ADMIN")) {
      router.push("/");
      return;
    }

    const accessToken = token;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [eventsResponse, logsResponse] = await Promise.all([
          api.getAdminEvents(accessToken),
          api.getSyncLogs(accessToken)
        ]);
        setEvents(eventsResponse.events);
        setLogs(logsResponse.logs);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [account?.roles, hydrated, router, token]);

  async function changeStatus(eventId: string, status: EventStatus) {
    if (!token) {
      return;
    }

    try {
      const response = await api.updateAdminEventStatus(eventId, status, token);
      setEvents((current) => current.map((item) => (item.id === eventId ? response.event : item)));
      setMessage(`Event status updated to ${status}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update event status.");
    }
  }

  async function syncNow() {
    if (!token) {
      return;
    }

    const accessToken = token;

    try {
      const response = await api.syncEvents(accessToken);
      const [eventsResponse, logsResponse] = await Promise.all([
        api.getAdminEvents(accessToken),
        api.getSyncLogs(accessToken)
      ]);
      setEvents(eventsResponse.events);
      setLogs(logsResponse.logs);
      setMessage(response.error ? response.error : `Sync completed. Processed ${response.importedCount} events.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Sync failed.");
    }
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <SectionHeading title="Admin Panel" description="This first release keeps the admin flow narrow: event visibility plus external sync." />

      {message ? <div className="message status-success">{message}</div> : null}
      {error ? <div className="message status-danger">{error}</div> : null}

      <section className="admin-grid">
        <div className="panel stack">
          <h3 style={{ margin: 0 }}>Sync Controls</h3>
          <p className="muted" style={{ margin: 0 }}>
            A scheduled sync runs every 6 hours, and you can also trigger it manually. When no Eventbrite token is configured, the app imports built-in sample data.
          </p>
          <button type="button" className="button" onClick={syncNow}>
            Sync Now
          </button>
        </div>
        <div className="panel stack">
          <h3 style={{ margin: 0 }}>Scope Notes</h3>
          <p className="muted" style={{ margin: 0 }}>
            User management, review moderation, notification rules, and other advanced modules are intentionally deferred to phase two.
          </p>
        </div>
      </section>

      <section className="panel stack">
        <h3 style={{ margin: 0 }}>Event Management</h3>
        {loading ? <div className="message">Loading event data...</div> : null}
        <div className="table-like">
          {events.map((event) => (
            <div key={event.id} className="table-row">
              <div className="inline-actions">
                <strong>{event.title}</strong>
                <span className="badge">{event.source === "EXTERNAL" ? "External" : "Internal"}</span>
                <span className="eyebrow">{event.status}</span>
              </div>
              <span className="muted">{formatDateRange(event.startsAt, event.endsAt)}</span>
              <div className="toolbar">
                <button type="button" className="button-subtle" onClick={() => changeStatus(event.id, "PUBLISHED")}>
                  Publish
                </button>
                <button type="button" className="button-subtle" onClick={() => changeStatus(event.id, "HIDDEN")}>
                  Hide
                </button>
                <button type="button" className="button-subtle" onClick={() => changeStatus(event.id, "DRAFT")}>
                  Draft
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <h3 style={{ margin: 0 }}>Sync Logs</h3>
        <div className="table-like">
          {logs.map((log) => (
            <div key={log.id} className="table-row">
              <div className="inline-actions">
                <strong>{log.provider}</strong>
                <span className={`eyebrow${log.status === "FAILED" ? " status-danger" : ""}`}>{log.status}</span>
                <span className="muted">{new Date(log.syncedAt).toLocaleString("en-US")}</span>
              </div>
              <span className="muted">{log.message}</span>
              <span className="muted">Imported: {log.importedCount}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
