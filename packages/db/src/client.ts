import { PrismaClient } from "./generated/client";

const globalForPrisma = globalThis as unknown as { __timeupPrisma?: PrismaClient };

/**
 * Base (UNSCOPED) Prisma client. Do NOT use directly in admin/colaborador request
 * code — use `getTenantDb()` so queries are tenant-scoped. Direct use is allowed only
 * in (master) routes, auth lookups, and the worker. Aliased as `masterDb`.
 */
export const basePrisma: PrismaClient =
  globalForPrisma.__timeupPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__timeupPrisma = basePrisma;
}
