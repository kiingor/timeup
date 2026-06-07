import { getTenantDb } from "@timeup/db";
import { pctOfTier } from "@timeup/core";

export async function getMetaTiers(tenantId: string) {
  return getTenantDb(tenantId).metaTier.findMany({ orderBy: { orderIndex: "asc" } });
}

export async function getActiveMetaTiers(tenantId: string) {
  return getTenantDb(tenantId).metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } });
}

export interface ColaboradorListRow {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
  linked: boolean;
  softcomVendedorId: string | null;
  realized: number;
  hasLogin: boolean;
  empresaId: string;
  empresaName: string;
}

export async function listColaboradores(
  tenantId: string,
  year: number,
  month: number,
  empresaId: string | null = null,
): Promise<ColaboradorListRow[]> {
  const db = getTenantDb(tenantId);
  const empresaWhere = empresaId ? { empresaId } : {};
  const [colabs, monthly] = await Promise.all([
    db.colaborador.findMany({
      where: { ...empresaWhere },
      orderBy: { name: "asc" },
      include: { user: { select: { id: true } }, empresa: { select: { name: true } } },
    }),
    db.salesMonthly.findMany({ where: { periodYear: year, periodMonth: month, ...empresaWhere } }),
  ]);
  const realized = new Map(monthly.map((m) => [m.colaboradorId, Number(m.realizedBrl)]));
  return colabs.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    active: c.active,
    linked: Boolean(c.softcomVendedorId),
    softcomVendedorId: c.softcomVendedorId,
    realized: realized.get(c.id) ?? 0,
    hasLogin: Boolean(c.user),
    empresaId: c.empresaId,
    empresaName: c.empresa.name,
  }));
}

export async function getColaborador(tenantId: string, id: string) {
  return getTenantDb(tenantId).colaborador.findFirst({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  });
}

/** Store goal (R$) for a period. Single empresa = its goal; "Todas" (null) = sum of all. */
export async function getStoreGoal(
  tenantId: string,
  year: number,
  month: number,
  empresaId: string | null = null,
): Promise<number> {
  const db = getTenantDb(tenantId);
  if (empresaId) {
    const g = await db.monthlyStoreGoal.findFirst({ where: { periodYear: year, periodMonth: month, empresaId } });
    return g ? Number(g.targetBrl) : 0;
  }
  const all = await db.monthlyStoreGoal.findMany({ where: { periodYear: year, periodMonth: month } });
  return all.reduce((s, g) => s + Number(g.targetBrl), 0);
}

/** Per-tier targets for a single colaborador in a period, keyed by tierId. */
export interface GoalValue {
  target: number;
  bonus: number;
}

export async function getColaboradorGoals(
  tenantId: string,
  colaboradorId: string,
  year: number,
  month: number,
): Promise<Map<string, GoalValue>> {
  const goals = await getTenantDb(tenantId).colaboradorGoal.findMany({
    where: { colaboradorId, periodYear: year, periodMonth: month },
  });
  return new Map(
    goals.map((g) => [g.metaTierId, { target: Number(g.targetBrl), bonus: g.bonusBrl != null ? Number(g.bonusBrl) : 0 }]),
  );
}

export interface MetasOverviewRow {
  id: string;
  name: string;
  realized: number;
  targets: Record<string, number>; // tierId -> target
  referencePct: number; // vs reference tier
}

export async function getMetasOverview(tenantId: string, year: number, month: number, empresaId: string | null = null) {
  const db = getTenantDb(tenantId);
  const empresaWhere = empresaId ? { empresaId } : {};
  const period = { periodYear: year, periodMonth: month };
  const [tiers, colabs, goals, monthly, storeGoals] = await Promise.all([
    db.metaTier.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
    db.colaborador.findMany({ where: { active: true, ...empresaWhere }, orderBy: { name: "asc" } }),
    db.colaboradorGoal.findMany({ where: { ...period, ...empresaWhere } }),
    db.salesMonthly.findMany({ where: { ...period, ...empresaWhere } }),
    db.monthlyStoreGoal.findMany({ where: { ...period, ...empresaWhere } }),
  ]);

  const realizedByColab = new Map(monthly.map((m) => [m.colaboradorId, Number(m.realizedBrl)]));
  const referenceTier = tiers[Math.min(1, tiers.length - 1)];

  const rows: MetasOverviewRow[] = colabs.map((c) => {
    const targets: Record<string, number> = {};
    for (const g of goals) {
      if (g.colaboradorId === c.id) targets[g.metaTierId] = Number(g.targetBrl);
    }
    const realized = realizedByColab.get(c.id) ?? 0;
    const refTarget = referenceTier ? (targets[referenceTier.id] ?? 0) : 0;
    return { id: c.id, name: c.name, realized, targets, referencePct: pctOfTier(realized, refTarget) };
  });

  const realizedTotal = monthly.reduce((s, m) => s + Number(m.realizedBrl), 0);
  const storeGoal = storeGoals.reduce((s, g) => s + Number(g.targetBrl), 0);

  return {
    tiers,
    rows,
    storeGoal,
    realizedTotal,
    referenceTierId: referenceTier?.id ?? null,
  };
}
