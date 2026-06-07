"use server";

import { revalidatePath } from "next/cache";
import { masterDb } from "@timeup/db";
import { assertAdmin } from "@/lib/authz";

export type ReleaseResult = { ok: true; released: boolean } | { ok: false; error: string };

/**
 * Toggle whether the month's ranking is visible to colaboradores (drives /me/ranking).
 * Per-empresa: each empresa releases independently (the colaborador sees their own empresa).
 */
export async function setRankingReleased(empresaId: string, year: number, month: number, released: boolean): Promise<ReleaseResult> {
  let user;
  try {
    user = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  if (!empresaId) return { ok: false, error: "Selecione uma empresa para liberar o ranking." };

  try {
    const empresa = await masterDb.empresa.findFirst({ where: { id: empresaId, tenantId: user.tenantId }, select: { id: true } });
    if (!empresa) return { ok: false, error: "Empresa inválida." };
    await masterDb.monthSettings.upsert({
      where: { tenantId_empresaId_periodYear_periodMonth: { tenantId: user.tenantId, empresaId, periodYear: year, periodMonth: month } },
      update: { rankingReleasedToColaborador: released },
      create: { tenantId: user.tenantId, empresaId, periodYear: year, periodMonth: month, rankingReleasedToColaborador: released },
    });
    revalidatePath("/app/ranking");
    return { ok: true, released };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao atualizar." };
  }
}
