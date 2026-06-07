import { getTenantDb } from "@timeup/db";
import { pctOfTier } from "@timeup/core";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DEFAULT_TIER_COLOR = "#7c5cff";

/** One meta tier's progress for a colaborador. R$ targets are admin-only (this is the admin view). */
export interface TierProgress {
  id: string;
  name: string;
  color: string;
  target: number;
  pct: number;
  reached: boolean;
}

export interface ColaboradorDashRow {
  id: string;
  name: string;
  realized: number;
  rank: number | null;
  linked: boolean;
  tiers: TierProgress[];
  topReachedName: string | null;
}

/** Store-wide achievement for one tier: how many colaboradores hit it. */
export interface TierStat {
  id: string;
  name: string;
  color: string;
  reachedCount: number;
  totalWithGoal: number;
}

export interface StoreSummary {
  target: number;
  realized: number;
  pct: number;
  salesCount: number;
  ticketMedio: number;
}

export interface AdminDashboard {
  periodLabel: string;
  year: number;
  month: number;
  store: StoreSummary;
  tierStats: TierStat[];
  colaboradorCount: number;
  colaboradores: ColaboradorDashRow[];
}

export async function getAdminDashboard(
  tenantId: string,
  empresaId: string | null = null,
  year?: number,
  month?: number,
): Promise<AdminDashboard> {
  const db = getTenantDb(tenantId);
  const now = new Date();
  year = year ?? now.getUTCFullYear();
  month = month ?? now.getUTCMonth() + 1;
  const period = { periodYear: year, periodMonth: month };
  const empresaWhere = empresaId ? { empresaId } : {};

  const [storeGoals, storeMonthlies, colaboradores, monthly, tiers, goals] = await Promise.all([
    db.monthlyStoreGoal.findMany({ where: { ...period, ...empresaWhere } }),
    db.storeMonthly.findMany({ where: { ...period, ...empresaWhere } }),
    db.colaborador.findMany({ where: { active: true, ...empresaWhere }, orderBy: { name: "asc" } }),
    db.salesMonthly.findMany({ where: { ...period, ...empresaWhere } }),
    db.metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
    db.colaboradorGoal.findMany({ where: { ...period, ...empresaWhere } }),
  ]);

  const realizedByColab = new Map(monthly.map((m) => [m.colaboradorId, Number(m.realizedBrl)]));
  const rankByColab = new Map(monthly.map((m) => [m.colaboradorId, m.rankPosition]));
  // goals keyed by "colaboradorId:tierId"
  const targetByKey = new Map(goals.map((g) => [`${g.colaboradorId}:${g.metaTierId}`, Number(g.targetBrl)]));

  // per-tier achievement tallies for the store resumo
  const tierStats: TierStat[] = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color ?? DEFAULT_TIER_COLOR,
    reachedCount: 0,
    totalWithGoal: 0,
  }));
  const tierStatById = new Map(tierStats.map((s) => [s.id, s]));

  const rows: ColaboradorDashRow[] = colaboradores.map((c) => {
    const realized = realizedByColab.get(c.id) ?? 0;
    const tp: TierProgress[] = [];
    let topReachedName: string | null = null;
    for (const t of tiers) {
      const target = targetByKey.get(`${c.id}:${t.id}`) ?? 0;
      if (target <= 0) continue; // only show tiers this colaborador actually has a meta for
      const reached = realized >= target;
      tp.push({ id: t.id, name: t.name, color: t.color ?? DEFAULT_TIER_COLOR, target, pct: pctOfTier(realized, target), reached });
      const stat = tierStatById.get(t.id);
      if (stat) {
        stat.totalWithGoal += 1;
        if (reached) stat.reachedCount += 1;
      }
      if (reached) topReachedName = t.name; // tiers iterate low→high, so last reached = highest
    }
    return {
      id: c.id,
      name: c.name,
      realized,
      rank: rankByColab.get(c.id) ?? null,
      linked: Boolean(c.softcomVendedorId),
      tiers: tp,
      topReachedName,
    };
  });
  rows.sort((a, b) => b.realized - a.realized);

  const storeTarget = storeGoals.reduce((s, g) => s + Number(g.targetBrl), 0);
  const storeSalesCount = storeMonthlies.reduce((s, m) => s + m.salesCount, 0);
  const storeRealized = storeMonthlies.length
    ? storeMonthlies.reduce((s, m) => s + Number(m.realizedBrl), 0)
    : rows.reduce((s, r) => s + r.realized, 0);

  return {
    periodLabel: `${MONTHS_PT[month - 1]} ${year}`,
    year,
    month,
    store: {
      target: storeTarget,
      realized: storeRealized,
      pct: pctOfTier(storeRealized, storeTarget),
      salesCount: storeSalesCount,
      ticketMedio: storeSalesCount > 0 ? storeRealized / storeSalesCount : 0,
    },
    tierStats,
    colaboradorCount: colaboradores.length,
    colaboradores: rows,
  };
}
