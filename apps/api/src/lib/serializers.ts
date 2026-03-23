import { EventSource, EventStatus, type AccountRoleName } from "@prisma/client";

type EventRecord = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  category: string;
  venue: string;
  address: string;
  city: string;
  startsAt: Date;
  endsAt: Date;
  isFree: boolean;
  price: { toNumber(): number } | null;
  source: EventSource;
  sourceName: string | null;
  externalEventId: string | null;
  lastSyncedAt: Date | null;
  status: EventStatus;
  _count?: {
    favourites?: number;
    bookings?: number;
  };
};

export function serializeRoles(roles: { role: { name: AccountRoleName } }[]) {
  return roles.map((entry) => entry.role.name);
}

export function serializeEvent(event: EventRecord) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    bannerUrl: event.bannerUrl,
    category: event.category,
    venue: event.venue,
    address: event.address,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    isFree: event.isFree,
    price: event.price ? Number(event.price.toNumber()) : null,
    source: event.source,
    sourceName: event.sourceName,
    externalEventId: event.externalEventId,
    lastSyncedAt: event.lastSyncedAt?.toISOString() ?? null,
    status: event.status,
    favouriteCount: event._count?.favourites ?? 0,
    bookingCount: event._count?.bookings ?? 0
  };
}
