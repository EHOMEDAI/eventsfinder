import jwt from "jsonwebtoken";
import { env } from "../env.js";

type TokenPayload = {
  accountId: string;
  email: string;
  roles: string[];
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
