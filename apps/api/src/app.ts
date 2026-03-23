import express from "express";
import cors from "cors";
import morgan from "morgan";
import cron from "node-cron";
import { prisma } from "./lib/prisma.js";
import { optionalAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { eventsRouter } from "./routes/events.js";
import { meRouter } from "./routes/me.js";
import { adminRouter } from "./routes/admin.js";
import { syncExternalEvents } from "./services/external-events.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(optionalAuth);

  app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/events", eventsRouter);
  app.use("/me", meRouter);
  app.use("/admin", adminRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  });

  cron.schedule("0 */6 * * *", async () => {
    try {
      await syncExternalEvents();
    } catch (error) {
      console.error("Scheduled sync failed:", error);
    }
  });

  return app;
}
