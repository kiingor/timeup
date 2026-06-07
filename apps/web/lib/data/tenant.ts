import { masterDb } from "@timeup/db";
import { normalizeTheme, type ThemeTokens } from "@timeup/core";

/** Reads a tenant's own row (the caller's tenant). Safe: looked up by id. */
export async function getTenant(tenantId: string) {
  return masterDb.tenant.findUnique({ where: { id: tenantId } });
}

export async function getTenantTheme(tenantId: string): Promise<ThemeTokens> {
  const t = await masterDb.tenant.findUnique({ where: { id: tenantId }, select: { theme: true } });
  return normalizeTheme((t?.theme as Partial<ThemeTokens> | null) ?? null);
}
