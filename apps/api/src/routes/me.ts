import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { serializeEvent, serializeRoles } from "../lib/serializers.js";

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get("/", async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: req.auth!.accountId },
    include: {
      roles: { include: { role: true } }
    }
  });

  res.json({
    account: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      phone: account.phone,
      roles: serializeRoles(account.roles)
    }
  });
});

meRouter.get("/bookmarks", async (req, res) => {
  const favourites = await prisma.favourite.findMany({
    where: { accountId: req.auth!.accountId },
    include: {
      event: {
        include: {
          _count: {
            select: {
              favourites: true,
              bookings: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    events: favourites.map((item) => serializeEvent(item.event))
  });
});

meRouter.get("/bookings", async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { accountId: req.auth!.accountId },
    include: {
      event: {
        include: {
          _count: {
            select: {
              favourites: true,
              bookings: true
            }
          }
        }
      }
    },
    orderBy: { bookedAt: "desc" }
  });

  res.json({
    bookings: bookings.map((item) => ({
      id: item.id,
      status: item.status,
      bookedAt: item.bookedAt.toISOString(),
      event: serializeEvent(item.event)
    }))
  });
});
