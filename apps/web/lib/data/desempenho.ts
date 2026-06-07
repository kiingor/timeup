import { getTenantDb } from "@timeup/db";
import { currentPeriod, recentPeriods, periodLabel } from "@/lib/period";
import type { TierStat } from "@/lib/data/admin-dashboard";

const DEFAULT_TIER_COLOR = "#7c5cff";
const SHORT_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export interface MonthPoint {
  year: number;
  month: number;
  label: string; // "Jan/26"
  faturamento: number;
  meta: number | null;
  salesCount: number;
  ticketMedio: number;
  partial: boolean; // current calendar month (data still accumulating)
}

export interface ColabSeries {
  id: string;
  name: string;
  currentRealized: number;
  currentRank: number | null;
  series: { label: string; realized: number }[];
}

export interface DeltaKpi {
  current: number;
  prev: number;
  pct: number; // fractional change vs previous month; 0 when prev is 0
}

export interface DesempenhoData {
  periodLabel: string;
  months: MonthPoint[];
  deltas: { faturamento: DeltaKpi; ticketMedio: DeltaKpi; salesCount: DeltaKpi };
  colaboradores: ColabSeries[];
  tierStats: TierStat[];
  hasData: boolean;
}

function delta(current: number, prev: number): DeltaKpi {
  return { current, prev, pct: prev > 0 ? (current - prev) / prev : 0 };
}

/** Admin analytics: store + seller trends across the last `count` months (R$ allowed). */
export async function getDesempenho(tenantId: string, empresaId: string | null = null, count = 6): Promise<DesempenhoData> {
  const db = getTenantDb(tenantId);
  const cur = currentPeriod();
  const periods = recentPeriods(count).slice().reverse(); // chronological oldest→newest
  const oldest = periods[0] ?? cur;

  const empresaWhere = empresaId ? { empresaId } : {};
  const inRange = { periodYear: { gte: oldest.year }, ...empresaWhere };

  const [storeRows, salesRows, colaboradores, tiers, goals] = await Promise.all([
    db.storeMonthly.findMany({ where: inRange }),
    db.salesMonthly.findMany({ where: inRange }),
    db.colaborador.findMany({ where: { active: true, ...empresaWhere }, select: { id: true, name: true } }),
    db.metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
    db.colaboradorGoal.findMany({ where: { periodYear: cur.year, periodMonth: cur.month, ...empresaWhere } }),
  ]);

  const key = (y: number, m: number) => `${y}-${m}`;
  // "Todas" sums store rows across empresas per month; a single empresa has one row.
  const storeBy = new Map<string, { faturamento: number; salesCount: number; meta: number | null }>();
  for (const s of storeRows) {
    const k = key(s.periodYear, s.periodMonth);
    const acc = storeBy.get(k) ?? { faturamento: 0, salesCount: 0, meta: null };
    acc.faturamento += Number(s.realizedBrl);
    acc.salesCount += s.salesCount;
    if (s.budgetBrl != null) acc.meta = (acc.meta ?? 0) + Number(s.budgetBrl);
    storeBy.set(k, acc);
  }

  const months: MonthPoint[] = periods.map((p) => {
    const s = storeBy.get(key(p.year, p.month));
    const faturamento = s?.faturamento ?? 0;
    const salesCount = s?.salesCount ?? 0;
    return {
      year: p.year,
      month: p.month,
      label: `${SHORT_MONTHS[p.month - 1]}/${String(p.year).slice(2)}`,
      faturamento,
      meta: s?.meta ?? null,
      salesCount,
      ticketMedio: salesCount > 0 ? faturamento / salesCount : 0,
      partial: p.year === cur.year && p.month === cur.month,
    };
  });

  const lastTwo = months.slice(-2);
  const prev = lastTwo[0];
  const last = lastTwo[1] ?? months[months.length - 1];
  const deltas = {
    faturamento: delta(last?.faturamento ?? 0, prev?.faturamento ?? 0),
    ticketMedio: delta(last?.ticketMedio ?? 0, prev?.ticketMedio ?? 0),
    salesCount: delta(last?.salesCount ?? 0, prev?.salesCount ?? 0),
  };

  // per-colaborador realized series, top 5 by current-month realized
  const nameById = new Map(colaboradores.map((c) => [c.id, c.name]));
  const realizedBy = new Map<string, number>(); // "colab|y-m" -> realized
  const rankCur = new Map<string, number | null>();
  for (const r of salesRows) {
    realizedBy.set(`${r.colaboradorId}|${key(r.periodYear, r.periodMonth)}`, Number(r.realizedBrl));
    if (r.periodYear === cur.year && r.periodMonth === cur.month) rankCur.set(r.colaboradorId, r.rankPosition);
  }
  const colabSeries: ColabSeries[] = colaboradores
    .map((c) => ({
      id: c.id,
      name: c.name,
      currentRealized: realizedBy.get(`${c.id}|${key(cur.year, cur.month)}`) ?? 0,
      currentRank: rankCur.get(c.id) ?? null,
      series: months.map((m) => ({ label: m.label, realized: realizedBy.get(`${c.id}|${key(m.year, m.month)}`) ?? 0 })),
    }))
    .filter((c) => c.series.some((s) => s.realized > 0))
    .sort((a, b) => b.currentRealized - a.currentRealized)
    .slice(0, 5);

  // current-month tier attainment
  const realizedCur = new Map<string, number>();
  for (const r of salesRows) {
    if (r.periodYear === cur.year && r.periodMonth === cur.month) realizedCur.set(r.colaboradorId, Number(r.realizedBrl));
  }
  const goalByKey = new Map(goals.map((g) => [`${g.colaboradorId}:${g.metaTierId}`, Number(g.targetBrl)]));
  const tierStats: TierStat[] = tiers.map((t) => {
    let reachedCount = 0;
    let totalWithGoal = 0;
    for (const c of colaboradores) {
      const target = goalByKey.get(`${c.id}:${t.id}`) ?? 0;
      if (target <= 0) continue;
      totalWithGoal++;
      if ((realizedCur.get(c.id) ?? 0) >= target) reachedCount++;
    }
    return { id: t.id, name: t.name, color: t.color ?? DEFAULT_TIER_COLOR, reachedCount, totalWithGoal };
  });

  return {
    periodLabel: periodLabel(cur.year, cur.month),
    months,
    deltas,
    colaboradores: colabSeries,
    tierStats,
    hasData: storeRows.length > 0,
  };
}
