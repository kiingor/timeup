import { basePrisma } from "./client";

/**
 * Unscoped client for cross-tenant operations. Use ONLY in:
 *  - (master) routes (managing tenants, global users)
 *  - auth lookups (find user by email before tenant is known)
 *  - the sync worker (iterates tenants explicitly)
 */
export const masterDb = basePrisma;
