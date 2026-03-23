import type { AccountRoleName } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        accountId: string;
        email: string;
        roles: AccountRoleName[];
      };
    }
  }
}

export {};
