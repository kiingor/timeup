import { getTenantDb } from "@timeup/db";
import { pctOfTier } from "@timeup/core";
import type { TierProgress } from "@/lib/data/admin-dashboard";

const DEFAULT_TIER_COLOR = "#7c5cff";

export interface RankingRow {
  id: string;
  name: string;
  rank: number | null;
  realized: number;
  linked: boolean;
  tiers: TierProgress[];
  topReachedName: string | null;
}

export interface AdminRanking {
  released: boolean;
  storeRealized: number;
  rows: RankingRow[];
}

/**
 * Admin leaderboard for a period: full R$ + per-tier % for every active colaborador,
 * ordered by realized desc. Admin-only view (R$ allowed). Also surfaces whether the
 * ranking is released to colaboradores (drives the toggle in the UI).
 */
export async function getAdminRanking(
  tenantId: string,
  year: number,
  month: number,
  empresaId: string | null = null,
): Promise<AdminRanking> {
  const db = getTenantDb(tenantId);
  const period = { periodYear: year, periodMonth: month };
  const empresaWhere = empresaId ? { empresaId } : {};

  const [colaboradores, monthly, tiers, goals, settingsList, storeList] = await Promise.all([
    db.colaborador.findMany({ where: { active: true, ...empresaWhere }, orderBy: { name: "asc" } }),
    db.salesMonthly.findMany({ where: { ...period, ...empresaWhere } }),
    db.metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
    db.colaboradorGoal.findMany({ where: { ...period, ...empresaWhere } }),
    db.monthSettings.findMany({ where: { ...period, ...empresaWhere } }),
    db.storeMonthly.findMany({ where: { ...period, ...empresaWhere } }),
  ]);

  const realizedByColab = new Map(monthly.map((m) => [m.colaboradorId, Number(m.realizedBrl)]));
  const rankByColab = new Map(monthly.map((m) => [m.colaboradorId, m.rankPosition]));
  const targetByKey = new Map(goals.map((g) => [`${g.colaboradorId}:${g.metaTierId}`, Number(g.targetBrl)]));

  const rows: RankingRow[] = colaboradores.map((c) => {
    const realized = realizedByColab.get(c.id) ?? 0;
    const tp: TierProgress[] = [];
    let topReachedName: string | null = null;
    for (const t of tiers) {
      const target = targetByKey.get(`${c.id}:${t.id}`) ?? 0;
      if (target <= 0) continue;
      const reached = realized >= target;
      tp.push({ id: t.id, name: t.name, color: t.color ?? DEFAULT_TIER_COLOR, target, pct: pctOfTier(realized, target), reached });
      if (reached) topReachedName = t.name;
    }
    return {
      id: c.id,
      name: c.name,
      rank: rankByColab.get(c.id) ?? null,
      realized,
      linked: Boolean(c.softcomVendedorId),
      tiers: tp,
      topReachedName,
    };
  });
  rows.sort((a, b) => b.realized - a.realized);
  // "Todas" combines empresas into one leaderboard recomputed on read; a single empresa
  // keeps its stored per-empresa rankPosition.
  if (!empresaId) rows.forEach((r, i) => (r.rank = i + 1));

  const released = empresaId
    ? Boolean(settingsList[0]?.rankingReleasedToColaborador)
    : settingsList.length > 0 && settingsList.every((s) => s.rankingReleasedToColaborador);
  const storeRealized = storeList.length
    ? storeList.reduce((s, m) => s + Number(m.realizedBrl), 0)
    : rows.reduce((s, r) => s + r.realized, 0);

  return { released, storeRealized, rows };
}
