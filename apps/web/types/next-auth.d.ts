import type { Role } from "@timeup/core";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      role: Role;
      tenantId: string | null;
      colaboradorId: string | null;
      name: string;
      email: string;
    };
  }

  interface User {
    role: Role;
    tenantId: string | null;
    colaboradorId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    tenantId: string | null;
    colaboradorId: string | null;
  }
}
