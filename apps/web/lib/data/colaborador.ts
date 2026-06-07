import { getTenantDb } from "@timeup/db";
import {
  pctOfTier,
  pctRemaining,
  reachedTier,
  type ColaboradorDashboardDTO,
  type ColaboradorTierDTO,
} from "@timeup/core";
import { recentPeriods } from "@/lib/period";

/**
 * SECURITY-CRITICAL: builds the colaborador dashboard returning ONLY percentages.
 * Monetary values (targets and realized) are read into local numbers, used to compute
 * ratios, and NEVER placed on the returned DTO. The DTO type carries no R$ fields, so
 * no amount can reach the client (not in HTML, not in the RSC payload).
 */
export async function getColaboradorDashboard(
  tenantId: string,
  colaboradorId: string,
  year: number,
  month: number,
): Promise<ColaboradorDashboardDTO> {
  const db = getTenantDb(tenantId);
  const period = { periodYear: year, periodMonth: month };

  // the colaborador belongs to one empresa; ranking release is gated per-empresa
  const me = await db.colaborador.findFirst({ where: { id: colaboradorId }, select: { name: true, empresaId: true } });
  const empresaId = me?.empresaId;

  const [colab, tiers, goals, monthly, monthSettings] = await Promise.all([
    Promise.resolve(me),
    db.metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
    db.colaboradorGoal.findMany({ where: { colaboradorId, ...period } }),
    db.salesMonthly.findFirst({ where: { colaboradorId, ...period } }),
    empresaId ? db.monthSettings.findFirst({ where: { ...period, empresaId } }) : Promise.resolve(null),
  ]);

  // local-only numbers — never returned (except a tier's prize, and only once reached)
  const realized = monthly ? Number(monthly.realizedBrl) : 0;
  const targetByTier = new Map(goals.map((g) => [g.metaTierId, Number(g.targetBrl)]));
  const bonusByTier = new Map(goals.map((g) => [g.metaTierId, g.bonusBrl != null ? Number(g.bonusBrl) : 0]));

  const tierDTOs: ColaboradorTierDTO[] = tiers.map((t) => {
    const target = targetByTier.get(t.id) ?? 0;
    const bonus = bonusByTier.get(t.id) ?? 0;
    const reached = reachedTier(realized, target);
    return {
      tierId: t.id,
      tierName: t.name,
      color: t.color,
      pctOfTier: pctOfTier(realized, target),
      pctRemaining: pctRemaining(realized, target),
      reached,
      // the prize R$ enters the payload ONLY when earned; a flag teases it otherwise
      bonusBrl: reached && bonus > 0 ? bonus : null,
      hasBonus: bonus > 0,
    };
  });

  // evolution as cumulative % toward the reference (middle/Média) tier — no R$
  const referenceTier = tiers[Math.min(1, tiers.length - 1)];
  const refTarget = referenceTier ? (targetByTier.get(referenceTier.id) ?? 0) : 0;

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const daily = await db.salesDaily.findMany({
    where: { colaboradorId, saleDate: { gte: start, lte: end } },
    orderBy: { saleDate: "asc" },
    select: { saleDate: true, realizedBrl: true },
  });

  let cum = 0;
  const evolution = daily.map((d) => {
    cum += Number(d.realizedBrl);
    const iso = d.saleDate.toISOString().slice(0, 10);
    return { date: iso, cumulativePct: pctOfTier(cum, refTarget) };
  });

  const rankReleased = Boolean(monthSettings?.rankingReleasedToColaborador);

  return {
    colaboradorName: colab?.name ?? "",
    periodYear: year,
    periodMonth: month,
    tiers: tierDTOs,
    evolution,
    rankPosition: rankReleased ? (monthly?.rankPosition ?? null) : null,
    rankReleased,
  };
}

export interface RankingEntryDTO {
  name: string;
  rankPosition: number | null;
  pct: number; // % of own reference tier — no R$
  isMe: boolean;
  vehicle: string | null; // chosen pixel-art vehicle for the race
}

/** Leaderboard for the colaborador — names + positions + %, never any R$. */
export async function getColaboradorRanking(
  tenantId: string,
  colaboradorId: string,
  year: number,
  month: number,
): Promise<{ released: boolean; entries: RankingEntryDTO[] }> {
  const db = getTenantDb(tenantId);
  const period = { periodYear: year, periodMonth: month };

  // the colaborador races within their OWN empresa, gated by that empresa's release flag
  const me = await db.colaborador.findFirst({ where: { id: colaboradorId }, select: { empresaId: true } });
  if (!me) return { released: false, entries: [] };
  const empresaId = me.empresaId;

  const settings = await db.monthSettings.findFirst({ where: { ...period, empresaId } });
  if (!settings?.rankingReleasedToColaborador) return { released: false, entries: [] };

  const [colabs, tiers, goals, monthly] = await Promise.all([
    db.colaborador.findMany({ where: { active: true, empresaId }, select: { id: true, name: true, vehicle: true } }),
    db.metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
    db.colaboradorGoal.findMany({ where: { ...period, empresaId } }),
    db.salesMonthly.findMany({ where: { ...period, empresaId } }),
  ]);
  const referenceTier = tiers[Math.min(1, tiers.length - 1)];
  const realizedByColab = new Map(monthly.map((m) => [m.colaboradorId, Number(m.realizedBrl)]));
  const rankByColab = new Map(monthly.map((m) => [m.colaboradorId, m.rankPosition]));

  const entries: RankingEntryDTO[] = colabs.map((c) => {
    const realized = realizedByColab.get(c.id) ?? 0;
    const target = referenceTier
      ? Number(goals.find((g) => g.colaboradorId === c.id && g.metaTierId === referenceTier.id)?.targetBrl ?? 0)
      : 0;
    return {
      name: c.name,
      rankPosition: rankByColab.get(c.id) ?? null,
      pct: pctOfTier(realized, target),
      isMe: c.id === colaboradorId,
      vehicle: c.vehicle,
    };
  });
  entries.sort((a, b) => (a.rankPosition ?? 999) - (b.rankPosition ?? 999));
  return { released: true, entries };
}

export interface HistoryRowDTO {
  year: number;
  month: number;
  pct: number; // reference-tier % — no R$
}

export async function getColaboradorHistory(
  tenantId: string,
  colaboradorId: string,
  months = 6,
): Promise<HistoryRowDTO[]> {
  const db = getTenantDb(tenantId);
  const periods = recentPeriods(months);
  const [tiers, goals, monthly] = await Promise.all([
    db.metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
    db.colaboradorGoal.findMany({ where: { colaboradorId } }),
    db.salesMonthly.findMany({ where: { colaboradorId } }),
  ]);
  const referenceTier = tiers[Math.min(1, tiers.length - 1)];

  return periods.map((p) => {
    const realized = Number(
      monthly.find((m) => m.periodYear === p.year && m.periodMonth === p.month)?.realizedBrl ?? 0,
    );
    const target = referenceTier
      ? Number(
          goals.find(
            (g) => g.metaTierId === referenceTier.id && g.periodYear === p.year && g.periodMonth === p.month,
          )?.targetBrl ?? 0,
        )
      : 0;
    return { year: p.year, month: p.month, pct: pctOfTier(realized, target) };
  });
}
