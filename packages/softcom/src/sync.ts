import { masterDb } from "@timeup/db";
import { clientConfigFromRow } from "./config";
import { getRankingVendedor, getFuncionarios, getKpi, type SoftcomClientConfig } from "./client";
import type { SoftcomKpi, SoftcomRankingVendedor } from "./types";

export interface SyncResult {
  status: "success" | "error";
  rowsUpserted: number;
  error?: string;
  empresa?: string | null;
}

/** Case/accent-insensitive name key for matching ranking SellerName to a funcionário. */
function nameKey(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** Look up a KPI value by its (accent/case-insensitive) Key. Returns null if absent. */
function kpiValue(kpis: SoftcomKpi[], key: string): number | null {
  const want = nameKey(key);
  const hit = kpis.find((k) => nameKey(k.Key) === want);
  const v = hit?.CurrentData?.Value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Builds the daily sales curve by querying rankingvendedor day-by-day (Dia=D gives each
 * seller's total FOR that day) and upserting sales_daily for linked colaboradores.
 * Only the current month is walked up to "today"; past months are walked in full.
 */
async function syncDailyFromRanking(
  cfg: SoftcomClientConfig,
  tenantId: string,
  empresaId: string,
  year: number,
  month: number,
  byVendedorId: Map<string, string>,
  byName: Map<string, string>,
): Promise<void> {
  const now = new Date();
  const isCurrentMonth = now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month;
  const lastDay = isCurrentMonth ? now.getUTCDate() : new Date(Date.UTC(year, month, 0)).getUTCDate();

  for (let d = 1; d <= lastDay; d++) {
    let dayRanking: SoftcomRankingVendedor[] = [];
    try {
      dayRanking = await getRankingVendedor(cfg, year, month, d);
    } catch {
      continue; // skip a day that errors, keep going
    }
    const saleDate = new Date(Date.UTC(year, month - 1, d));
    for (const raw of dayRanking) {
      const { vendedorId, name, total } = normalizeRankingRow(raw);
      const colaboradorId =
        (vendedorId && byVendedorId.get(vendedorId)) || (name && byName.get(nameKey(name))) || null;
      if (!colaboradorId || !(total > 0)) continue;
      await masterDb.salesDaily.upsert({
        where: { tenantId_empresaId_colaboradorId_saleDate: { tenantId, empresaId, colaboradorId, saleDate } },
        update: { realizedBrl: total, source: "rankingvendedor" },
        create: { tenantId, empresaId, colaboradorId, saleDate, realizedBrl: total, source: "rankingvendedor" },
      });
    }
  }
}

function normalizeRankingRow(r: SoftcomRankingVendedor): { vendedorId: string | null; name: string | null; total: number } {
  const id = r.vendedor_id ?? r.VendedorId ?? r.id ?? null;
  const name = r.SellerName ?? r.nome ?? r.Nome ?? null;
  const total = Number(r.Data?.Value ?? r.total ?? r.Total ?? r.valor ?? r.Valor ?? 0);
  return { vendedorId: id != null ? String(id) : null, name, total };
}

/** A tenant's empresa joined to its device connection (the credentials feeding it). */
type EmpresaWithConnection = {
  id: string;
  tenantId: string;
  name: string;
  connectionId: string | null;
  connection: {
    urlBase: string;
    clientId: string | null;
    clientSecretEnc: Uint8Array | null;
    clientSecretIv: Uint8Array | null;
    clientSecretTag: Uint8Array | null;
    enabled: boolean;
  } | null;
};

/**
 * Syncs ONE empresa from its connection: pulls the month's per-vendedor totals into
 * sales_monthly (realized + per-empresa rank), recomputes store_monthly, and walks the
 * daily curve. Idempotent. Records a sync_runs row scoped to the empresa/connection.
 */
export async function syncEmpresa(empresa: EmpresaWithConnection, ref: Date = new Date()): Promise<SyncResult> {
  const tenantId = empresa.tenantId;
  const empresaId = empresa.id;
  const cfg = clientConfigFromRow(empresa.connection);
  if (!empresa.connection?.enabled || !cfg) {
    return { status: "error", rowsUpserted: 0, error: "Conexão Softcom não configurada ou desativada.", empresa: empresa.name };
  }

  const run = await masterDb.syncRun.create({
    data: { tenantId, empresaId, connectionId: empresa.connectionId, status: "running" },
  });
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth() + 1;

  try {
    const ranking = await getRankingVendedor(cfg, year, month);

    const colabs = await masterDb.colaborador.findMany({
      where: { tenantId, empresaId, softcomVendedorId: { not: null } },
      select: { id: true, softcomVendedorId: true },
    });
    const colaboradorByVendedorId = new Map(colabs.map((c) => [String(c.softcomVendedorId), c.id]));

    // rankingvendedor identifies sellers ONLY by name (SellerName), so translate
    // name -> funcionário id -> linked colaborador. Funcionário fetch is tolerant:
    // if it fails we still try the (rare) numeric-id path.
    let funcionarios: { id: number; nome: string }[] = [];
    try {
      funcionarios = await getFuncionarios(cfg);
    } catch {
      /* keep going with id-only matching */
    }
    const colaboradorByName = new Map<string, string>();
    for (const c of colabs) {
      const f = funcionarios.find((x) => String(x.id) === String(c.softcomVendedorId));
      if (f) colaboradorByName.set(nameKey(f.nome), c.id);
    }

    let rows = 0;
    for (const raw of ranking) {
      const { vendedorId, name, total } = normalizeRankingRow(raw);
      const colaboradorId =
        (vendedorId && colaboradorByVendedorId.get(vendedorId)) ||
        (name && colaboradorByName.get(nameKey(name))) ||
        null;
      if (!colaboradorId) continue;
      await masterDb.salesMonthly.upsert({
        where: { tenantId_empresaId_colaboradorId_periodYear_periodMonth: { tenantId, empresaId, colaboradorId, periodYear: year, periodMonth: month } },
        update: { realizedBrl: total, rankPosition: null },
        create: { tenantId, empresaId, colaboradorId, periodYear: year, periodMonth: month, realizedBrl: total, rankPosition: null },
      });
      rows++;
    }

    // rank position is within THIS empresa's linked team (clean 1..N leaderboard),
    // recomputed from realized desc every run.
    const monthly = await masterDb.salesMonthly.findMany({
      where: { tenantId, empresaId, periodYear: year, periodMonth: month },
      orderBy: { realizedBrl: "desc" },
    });
    let p = 1;
    for (const m of monthly) {
      await masterDb.salesMonthly.update({ where: { id: m.id }, data: { rankPosition: p++ } });
    }

    // store_monthly: whole-store faturamento + sales count come from the KPI report
    // ("Total Faturamento" is the true store revenue — includes counter sales not tied
    // to a ranked seller — so it's the right number for the store KPI cards). Falls back
    // to the sum of linked sellers if KPIs are unavailable.
    let kpis: SoftcomKpi[] = [];
    try {
      kpis = await getKpi(cfg, year, month);
    } catch {
      /* tolerate — fall back to seller sum below */
    }
    const faturamento = kpiValue(kpis, "Total Faturamento");
    const salesCount = Math.round(kpiValue(kpis, "Quantidade de Vendas") ?? 0);

    const agg = await masterDb.salesMonthly.aggregate({
      where: { tenantId, empresaId, periodYear: year, periodMonth: month },
      _sum: { realizedBrl: true },
    });
    const sellerSum = Number(agg._sum.realizedBrl ?? 0);
    const storeRealized = faturamento != null && faturamento > 0 ? faturamento : sellerSum;
    const storeGoal = await masterDb.monthlyStoreGoal.findFirst({ where: { tenantId, empresaId, periodYear: year, periodMonth: month } });
    await masterDb.storeMonthly.upsert({
      where: { tenantId_empresaId_periodYear_periodMonth: { tenantId, empresaId, periodYear: year, periodMonth: month } },
      update: { realizedBrl: storeRealized, salesCount, budgetBrl: storeGoal ? storeGoal.targetBrl : null },
      create: { tenantId, empresaId, periodYear: year, periodMonth: month, realizedBrl: storeRealized, salesCount, budgetBrl: storeGoal ? storeGoal.targetBrl : null },
    });

    // daily evolution: per-vendedor per-day totals (rankingvendedor?Dia=D) → sales_daily
    await syncDailyFromRanking(cfg, tenantId, empresaId, year, month, colaboradorByVendedorId, colaboradorByName);

    await masterDb.syncRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        rowsUpserted: rows,
        endpointSummary: { empresa: empresa.name, rankingvendedor: ranking.length, matched: rows, faturamento: storeRealized, salesCount },
      },
    });

    return { status: "success", rowsUpserted: rows, empresa: empresa.name };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await masterDb.syncRun.update({ where: { id: run.id }, data: { status: "error", finishedAt: new Date(), error } });
    return { status: "error", rowsUpserted: 0, error, empresa: empresa.name };
  }
}

/**
 * Orchestrates a tenant sync by fanning out to each of its empresas (one Softcom device
 * connection per empresa). Aggregates the per-empresa results. Uses masterDb with explicit
 * tenantId (background job, runs across tenants).
 */
export async function syncTenant(tenantId: string, ref: Date = new Date()): Promise<SyncResult> {
  const empresas = (await masterDb.empresa.findMany({
    where: { tenantId, active: true, connection: { enabled: true } },
    include: { connection: true },
  })) as unknown as EmpresaWithConnection[];

  if (empresas.length === 0) {
    return { status: "error", rowsUpserted: 0, error: "Nenhuma empresa com integração Softcom ativa." };
  }

  let rows = 0;
  let okCount = 0;
  const errors: string[] = [];
  for (const emp of empresas) {
    const res = await syncEmpresa(emp, ref);
    rows += res.rowsUpserted;
    if (res.status === "success") okCount++;
    else if (res.error) errors.push(`${emp.name}: ${res.error}`);
  }

  if (okCount === 0) {
    return { status: "error", rowsUpserted: rows, error: errors.join(" | ") || "Falha no sync." };
  }
  return { status: "success", rowsUpserted: rows };
}

export interface BackfillResult {
  months: { year: number; month: number; status: SyncResult["status"]; rows: number }[];
  ok: number;
}

/**
 * Backfills the last `months` periods (including the current one) by running syncTenant
 * for each. Powers the Desempenho analytics with historical store/seller data. Idempotent.
 */
export async function syncHistory(tenantId: string, months = 6): Promise<BackfillResult> {
  const now = new Date();
  const out: BackfillResult["months"] = [];
  let ok = 0;
  for (let i = 0; i < months; i++) {
    const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const res = await syncTenant(tenantId, ref);
    if (res.status === "success") ok++;
    out.push({ year: ref.getUTCFullYear(), month: ref.getUTCMonth() + 1, status: res.status, rows: res.rowsUpserted });
  }
  return { months: out, ok };
}
