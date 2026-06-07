export * from "@prisma/client";
export { basePrisma } from "./client";
export { masterDb } from "./masterDb";
export { getTenantDb, type TenantDb } from "./tenantClient";
