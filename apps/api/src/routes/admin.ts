import { Router } from "express";
import { AccountRoleName, EventStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeEvent } from "../lib/serializers.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { syncExternalEvents } from "../services/external-events.js";

const statusSchema = z.object({
  status: z.nativeEnum(EventStatus)
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(AccountRoleName.ADMIN));

adminRouter.get("/events", async (_req, res) => {
  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: {
          favourites: true,
          bookings: true
        }
      }
    },
    orderBy: { startsAt: "asc" }
  });

  res.json({ events: events.map(serializeEvent) });
});

adminRouter.patch("/events/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid status payload." });
    return;
  }

  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) {
    res.status(404).json({ message: "Event not found." });
    return;
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: { status: parsed.data.status },
    include: {
      _count: {
        select: {
          favourites: true,
          bookings: true
        }
      }
    }
  });

  res.json({ event: serializeEvent(updated) });
});

adminRouter.post("/integrations/sync", async (_req, res) => {
  const result = await syncExternalEvents();
  res.json(result);
});

adminRouter.get("/integrations/logs", async (_req, res) => {
  const logs = await prisma.syncLog.findMany({
    include: {
      integration: true
    },
    orderBy: { syncedAt: "desc" },
    take: 20
  });

  res.json({
    logs: logs.map((log) => ({
      id: log.id,
      provider: log.integration.provider,
      status: log.status,
      message: log.message,
      importedCount: log.importedCount,
      syncedAt: log.syncedAt.toISOString()
    }))
  });
});
