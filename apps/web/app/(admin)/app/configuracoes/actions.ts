"use server";

import { revalidatePath } from "next/cache";
import { masterDb } from "@timeup/db";
import { themeSchema, normalizeTheme, type ThemeInput } from "@timeup/core";
import { assertAdmin } from "@/lib/authz";
import { writeAudit } from "@/lib/audit";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Admin updates their own tenant's theme/branding. */
export async function updateOwnTenantTheme(theme: ThemeInput): Promise<ActionResult> {
  const user = await assertAdmin();
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { ok: false, error: "Tema inválido." };

  await masterDb.tenant.update({
    where: { id: user.tenantId },
    data: { theme: normalizeTheme(parsed.data) as unknown as object },
  });
  await writeAudit(user.tenantId, user.userId, "update", "tenant.theme", user.tenantId);

  revalidatePath("/app");
  revalidatePath("/app/configuracoes/aparencia");
  return { ok: true };
}
