import type { NextFunction, Request, Response } from "express";
import { AccountRoleName } from "@prisma/client";
import { verifyToken } from "../lib/jwt.js";

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    req.auth = {
      accountId: payload.accountId,
      email: payload.email,
      roles: payload.roles as AccountRoleName[]
    };
  } catch {
    req.auth = undefined;
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  next();
}

export function requireRole(role: AccountRoleName) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    if (!req.auth.roles.includes(role)) {
      res.status(403).json({ message: "Insufficient permissions." });
      return;
    }

    next();
  };
}
