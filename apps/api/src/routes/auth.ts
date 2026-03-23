import { Router } from "express";
import bcrypt from "bcryptjs";
import { AccountRoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { serializeRoles } from "../lib/serializers.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
  phone: z.string().optional(),
  role: z.nativeEnum(AccountRoleName).default(AccountRoleName.USER)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid registration payload.", errors: parsed.error.flatten() });
    return;
  }

  const { email, password, displayName, phone } = parsed.data;
  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: "Email already registered." });
    return;
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: AccountRoleName.USER } });
  const passwordHash = await bcrypt.hash(password, 10);

  const account = await prisma.account.create({
    data: {
      email,
      passwordHash,
      displayName,
      phone,
      roles: {
        create: [{ roleId: role.id }]
      }
    },
    include: {
      roles: { include: { role: true } }
    }
  });

  const roles = serializeRoles(account.roles);
  const token = signToken({
    accountId: account.id,
    email: account.email,
    roles
  });

  res.status(201).json({
    token,
    account: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      roles
    }
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid login payload.", errors: parsed.error.flatten() });
    return;
  }

  const account = await prisma.account.findUnique({
    where: { email: parsed.data.email },
    include: {
      roles: { include: { role: true } }
    }
  });

  if (!account) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, account.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const roles = serializeRoles(account.roles);
  const token = signToken({
    accountId: account.id,
    email: account.email,
    roles
  });

  res.json({
    token,
    account: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      roles
    }
  });
});

authRouter.post("/logout", (_req, res) => {
  res.json({ message: "Logout successful on client side." });
});
