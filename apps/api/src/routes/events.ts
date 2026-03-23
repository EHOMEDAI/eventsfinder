import { Router } from "express";
import { EventSource, EventStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeEvent } from "../lib/serializers.js";
import { requireAuth } from "../middleware/auth.js";

const listSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  isFree: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  source: z.nativeEnum(EventSource).optional(),
  sort: z.enum(["soonest", "latest"]).default("soonest")
});

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters." });
    return;
  }

  const { q, category, city, isFree, source, sort } = parsed.data;
  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { venue: { contains: q } }
            ]
          }
        : {}),
      ...(category ? { category } : {}),
      ...(city ? { city } : {}),
      ...(isFree !== undefined ? { isFree } : {}),
      ...(source ? { source } : {})
    },
    include: {
      _count: {
        select: {
          favourites: true,
          bookings: true
        }
      }
    },
    orderBy: {
      startsAt: sort === "soonest" ? "asc" : "desc"
    }
  });

  res.json({ events: events.map(serializeEvent) });
});

eventsRouter.get("/:id", async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          favourites: true,
          bookings: true
        }
      }
    }
  });

  if (!event || event.status === EventStatus.HIDDEN) {
    res.status(404).json({ message: "Event not found." });
    return;
  }

  const favourite = req.auth
    ? await prisma.favourite.findUnique({
        where: {
          accountId_eventId: {
            accountId: req.auth.accountId,
            eventId: event.id
          }
        }
      })
    : null;
  const booking = req.auth
    ? await prisma.booking.findUnique({
        where: {
          accountId_eventId: {
            accountId: req.auth.accountId,
            eventId: event.id
          }
        }
      })
    : null;

  res.json({
    event: serializeEvent(event),
    isBookmarked: Boolean(favourite),
    hasBooked: Boolean(booking)
  });
});

eventsRouter.post("/:id/bookmark", requireAuth, async (req, res) => {
  const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== EventStatus.PUBLISHED) {
    res.status(404).json({ message: "Event not found." });
    return;
  }

  await prisma.favourite.upsert({
    where: {
      accountId_eventId: {
        accountId: req.auth!.accountId,
        eventId: event.id
      }
    },
    update: {},
    create: {
      accountId: req.auth!.accountId,
      eventId: event.id
    }
  });

  res.status(201).json({ message: "Bookmarked." });
});

eventsRouter.delete("/:id/bookmark", requireAuth, async (req, res) => {
  const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await prisma.favourite.deleteMany({
    where: {
      accountId: req.auth!.accountId,
      eventId
    }
  });

  res.json({ message: "Bookmark removed." });
});

eventsRouter.post("/:id/bookings", requireAuth, async (req, res) => {
  const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== EventStatus.PUBLISHED) {
    res.status(404).json({ message: "Event not found." });
    return;
  }

  const existing = await prisma.booking.findUnique({
    where: {
      accountId_eventId: {
        accountId: req.auth!.accountId,
        eventId: event.id
      }
    }
  });

  if (existing) {
    res.status(409).json({ message: "You have already registered for this event." });
    return;
  }

  const booking = await prisma.booking.create({
    data: {
      accountId: req.auth!.accountId,
      eventId: event.id
    }
  });

  res.status(201).json({
    message: "Registration confirmed.",
    booking: {
      id: booking.id,
      status: booking.status,
      bookedAt: booking.bookedAt.toISOString()
    }
  });
});
