export type AccountRole = "USER" | "ADMIN" | "ORGANIZER";
export type EventSource = "INTERNAL" | "EXTERNAL";
export type EventStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";
export type BookingStatus = "CONFIRMED" | "CANCELLED";

export type Event = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  category: string;
  venue: string;
  address: string;
  city: string;
  startsAt: string;
  endsAt: string;
  isFree: boolean;
  price: number | null;
  source: EventSource;
  sourceName: string | null;
  externalEventId: string | null;
  lastSyncedAt: string | null;
  status: EventStatus;
  favouriteCount: number;
  bookingCount: number;
};

export type Account = {
  id: string;
  email: string;
  displayName: string;
  roles: AccountRole[];
};

export type AuthResponse = {
  token: string;
  account: Account;
};
