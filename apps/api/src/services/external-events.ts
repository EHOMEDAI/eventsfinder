import { EventSource, EventStatus, SyncStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../env.js";

type ExternalEvent = {
  externalEventId: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  address: string;
  city: string;
  startsAt: string;
  endsAt: string;
  bannerUrl?: string;
  isFree: boolean;
  price?: number | null;
};

const fallbackEvents: ExternalEvent[] = [
  {
    externalEventId: "eb-demo-startup-brunch",
    title: "Startup Brunch Exchange",
    description: "Demo external event used when no Eventbrite token is configured.",
    category: "Business",
    venue: "LaunchPad @ one-north",
    address: "73 Ayer Rajah Crescent",
    city: "Singapore",
    startsAt: "2026-04-20T02:00:00.000Z",
    endsAt: "2026-04-20T04:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
    isFree: true
  },
  {
    externalEventId: "eb-demo-film-club",
    title: "Film Club Screening Night",
    description: "An external-source sample event with a discussion session afterwards.",
    category: "Arts",
    venue: "The Projector",
    address: "6001 Beach Rd",
    city: "Singapore",
    startsAt: "2026-04-23T11:30:00.000Z",
    endsAt: "2026-04-23T14:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    isFree: false,
    price: 18
  }
];

async function fetchEventbriteEvents(): Promise<ExternalEvent[]> {
  if (!env.EVENTBRITE_PRIVATE_TOKEN) {
    return fallbackEvents;
  }

  try {
    const response = await fetch("https://www.eventbriteapi.com/v3/events/search/?location.address=Singapore&expand=venue", {
      headers: {
        Authorization: `Bearer ${env.EVENTBRITE_PRIVATE_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Eventbrite sync failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      events?: Array<{
        id: string;
        name?: { text?: string | null };
        description?: { text?: string | null };
        start?: { utc?: string | null };
        end?: { utc?: string | null };
        logo?: { original?: { url?: string | null } | null } | null;
        is_free?: boolean;
        category?: { name_localized?: string | null } | null;
        venue?: {
          name?: string | null;
          address?: {
            localized_address_display?: string | null;
            city?: string | null;
          } | null;
        } | null;
      }>;
    };

    const mapped = (payload.events ?? [])
      .filter((item) => item.id && item.name?.text && item.start?.utc && item.end?.utc)
      .slice(0, 10)
      .map((item) => ({
        externalEventId: item.id,
        title: item.name?.text ?? "Untitled Event",
        description: item.description?.text ?? "Imported from Eventbrite.",
        category: item.category?.name_localized ?? "General",
        venue: item.venue?.name ?? "Unknown venue",
        address: item.venue?.address?.localized_address_display ?? "Address not provided",
        city: item.venue?.address?.city ?? "Singapore",
        startsAt: item.start?.utc ?? new Date().toISOString(),
        endsAt: item.end?.utc ?? new Date().toISOString(),
        bannerUrl: item.logo?.original?.url ?? undefined,
        isFree: item.is_free ?? true,
        price: null
      }));

    return mapped.length > 0 ? mapped : fallbackEvents;
  } catch {
    return fallbackEvents;
  }
}

export async function syncExternalEvents() {
  const integration = await prisma.apiIntegration.upsert({
    where: { provider: "eventbrite" },
    update: {
      enabled: Boolean(env.EVENTBRITE_PRIVATE_TOKEN),
      baseUrl: "https://www.eventbriteapi.com/v3",
      apiKey: env.EVENTBRITE_PRIVATE_TOKEN ? "***configured***" : null
    },
    create: {
      provider: "eventbrite",
      enabled: Boolean(env.EVENTBRITE_PRIVATE_TOKEN),
      baseUrl: "https://www.eventbriteapi.com/v3",
      apiKey: env.EVENTBRITE_PRIVATE_TOKEN ? "***configured***" : null
    }
  });

  try {
    const externalEvents = await fetchEventbriteEvents();
    let importedCount = 0;

    for (const item of externalEvents) {
      await prisma.event.upsert({
        where: {
          sourceName_externalEventId: {
            sourceName: "eventbrite",
            externalEventId: item.externalEventId
          }
        },
        update: {
          title: item.title,
          description: item.description,
          category: item.category,
          venue: item.venue,
          address: item.address,
          city: item.city,
          startsAt: new Date(item.startsAt),
          endsAt: new Date(item.endsAt),
          bannerUrl: item.bannerUrl,
          isFree: item.isFree,
          price: item.price ?? null,
          lastSyncedAt: new Date(),
          status: EventStatus.PUBLISHED
        },
        create: {
          title: item.title,
          description: item.description,
          category: item.category,
          venue: item.venue,
          address: item.address,
          city: item.city,
          startsAt: new Date(item.startsAt),
          endsAt: new Date(item.endsAt),
          bannerUrl: item.bannerUrl,
          isFree: item.isFree,
          price: item.price ?? null,
          source: EventSource.EXTERNAL,
          sourceName: "eventbrite",
          externalEventId: item.externalEventId,
          lastSyncedAt: new Date(),
          status: EventStatus.PUBLISHED
        }
      });
      importedCount += 1;
    }

    await prisma.apiIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() }
    });

    const message = env.EVENTBRITE_PRIVATE_TOKEN
      ? "Eventbrite sync completed."
      : "Fallback sample sync completed because EVENTBRITE_PRIVATE_TOKEN is not configured.";

    const log = await prisma.syncLog.create({
      data: {
        integrationId: integration.id,
        status: SyncStatus.SUCCESS,
        importedCount,
        message
      }
    });

    return { importedCount, log };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    const log = await prisma.syncLog.create({
      data: {
        integrationId: integration.id,
        status: SyncStatus.FAILED,
        importedCount: 0,
        message
      }
    });

    return { importedCount: 0, log, error: message };
  }
}
