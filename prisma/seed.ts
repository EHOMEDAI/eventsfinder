import { PrismaClient, AccountRoleName, EventSource, EventStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const roles = [AccountRoleName.USER, AccountRoleName.ADMIN, AccountRoleName.ORGANIZER];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: AccountRoleName.ADMIN } });
  const userRole = await prisma.role.findUniqueOrThrow({ where: { name: AccountRoleName.USER } });

  const admin = await prisma.account.upsert({
    where: { email: "admin@eventsfinder.local" },
    update: {},
    create: {
      email: "admin@eventsfinder.local",
      passwordHash,
      displayName: "Admin Demo",
      roles: {
        create: [{ roleId: adminRole.id }]
      }
    }
  });

  const user = await prisma.account.upsert({
    where: { email: "user@eventsfinder.local" },
    update: {},
    create: {
      email: "user@eventsfinder.local",
      passwordHash,
      displayName: "User Demo",
      roles: {
        create: [{ roleId: userRole.id }]
      }
    }
  });

  const integration = await prisma.apiIntegration.upsert({
    where: { provider: "eventbrite" },
    update: {
      enabled: false,
      baseUrl: "https://www.eventbriteapi.com/v3"
    },
    create: {
      provider: "eventbrite",
      enabled: false,
      baseUrl: "https://www.eventbriteapi.com/v3"
    }
  });

  const events = [
    {
      title: "Singapore Design Meetup",
      description: "A free evening meetup for local designers, product managers, and founders.",
      category: "Networking",
      venue: "Bugis+ Sky Lounge",
      address: "201 Victoria St",
      city: "Singapore",
      startsAt: new Date("2026-04-05T11:00:00.000Z"),
      endsAt: new Date("2026-04-05T13:00:00.000Z"),
      bannerUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
    },
    {
      title: "Weekend Yoga in the Park",
      description: "Outdoor wellness session suitable for beginners.",
      category: "Wellness",
      venue: "East Coast Park",
      address: "East Coast Park Service Rd",
      city: "Singapore",
      startsAt: new Date("2026-04-11T01:00:00.000Z"),
      endsAt: new Date("2026-04-11T02:30:00.000Z"),
      bannerUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80"
    },
    {
      title: "Indie Music Night",
      description: "An intimate live showcase featuring emerging local bands.",
      category: "Music",
      venue: "Esplanade Annexe Studio",
      address: "1 Esplanade Dr",
      city: "Singapore",
      startsAt: new Date("2026-04-18T12:00:00.000Z"),
      endsAt: new Date("2026-04-18T15:00:00.000Z"),
      bannerUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"
    }
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: {
        sourceName_externalEventId: {
          sourceName: "seed",
          externalEventId: event.title.toLowerCase().replace(/\s+/g, "-")
        }
      },
      update: {},
      create: {
        ...event,
        source: EventSource.INTERNAL,
        sourceName: "seed",
        externalEventId: event.title.toLowerCase().replace(/\s+/g, "-"),
        status: EventStatus.PUBLISHED
      }
    });
  }

  await prisma.syncLog.create({
    data: {
      integrationId: integration.id,
      status: "SUCCESS",
      importedCount: 3,
      message: "Initial seed completed."
    }
  });

  const firstEvent = await prisma.event.findFirstOrThrow();
  await prisma.favourite.upsert({
    where: { accountId_eventId: { accountId: user.id, eventId: firstEvent.id } },
    update: {},
    create: { accountId: user.id, eventId: firstEvent.id }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
