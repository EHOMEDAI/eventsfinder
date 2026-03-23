import type { AuthResponse, Event } from "./types";

function resolveApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }

  return "/api";
}

const API_BASE_URL = resolveApiBaseUrl();

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }

  return payload as T;
}

export const api = {
  login: (body: { email: string; password: string }) => request<AuthResponse>("/auth/login", { method: "POST", body }),
  register: (body: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }) => request<AuthResponse>("/auth/register", { method: "POST", body }),
  getEvents: (query = "") => request<{ events: Event[] }>(`/events${query ? `?${query}` : ""}`),
  getEvent: (id: string, token?: string | null) =>
    request<{ event: Event; isBookmarked: boolean; hasBooked: boolean }>(`/events/${id}`, { token }),
  bookmarkEvent: (id: string, token: string) => request(`/events/${id}/bookmark`, { method: "POST", token }),
  removeBookmark: (id: string, token: string) => request(`/events/${id}/bookmark`, { method: "DELETE", token }),
  bookEvent: (id: string, token: string) => request(`/events/${id}/bookings`, { method: "POST", token }),
  getBookmarks: (token: string) => request<{ events: Event[] }>("/me/bookmarks", { token }),
  getBookings: (token: string) =>
    request<{ bookings: Array<{ id: string; status: string; bookedAt: string; event: Event }> }>("/me/bookings", { token }),
  getProfile: (token: string) => request<{ account: { id: string; email: string; displayName: string; phone?: string; roles: string[] } }>("/me", { token }),
  getAdminEvents: (token: string) => request<{ events: Event[] }>("/admin/events", { token }),
  updateAdminEventStatus: (id: string, status: string, token: string) =>
    request<{ event: Event }>(`/admin/events/${id}/status`, { method: "PATCH", token, body: { status } }),
  syncEvents: (token: string) => request<{ importedCount: number; error?: string }>("/admin/integrations/sync", { method: "POST", token }),
  getSyncLogs: (token: string) =>
    request<{ logs: Array<{ id: string; provider: string; status: string; message: string; importedCount: number; syncedAt: string }> }>(
      "/admin/integrations/logs",
      { token }
    )
};
