import { NextResponse } from "next/server";
import { masterDb } from "@timeup/db";
import { syncTenant } from "@timeup/softcom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Days of the daily curve an automated run backfills (the month's totals/KPIs are always
 * refreshed in full). Keeps a scheduled run at ~5 Softcom calls per empresa so it finishes
 * well inside the serverless budget. Raise via SYNC_CRON_DAILY_DAYS if a day is ever missed.
 */
const DAILY_DAYS = Math.max(1, Number(process.env.SYNC_CRON_DAILY_DAYS ?? 5) || 5);

/** A tenant whose previous run started less than this ago is skipped (overlap guard). */
const RUNNING_LOCK_MS = 15 * 60_000;

/**
 * Accepts Vercel Cron (`Authorization: Bearer $CRON_SECRET`) and any external scheduler
 * (n8n, cron-job.org, the VPS worker) via `x-internal-secret: $INTERNAL_SYNC_SECRET`.
 * Secrets only travel in headers — never in the query string.
 */
function authorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  const internal = process.env.INTERNAL_SYNC_SECRET;
  if (internal && req.headers.get("x-internal-secret") === internal) return true;
  return false;
}

type TenantOutcome = {
  tenantId: string;
  status: "success" | "error" | "skipped";
  rows: number;
  error?: string;
};

async function runAll(): Promise<TenantOutcome[]> {
  // one device connection per empresa — distinct tenants that have at least one enabled
  const rows = await masterDb.tenantSoftcomConfig.findMany({
    where: { enabled: true },
    select: { tenantId: true },
  });
  const tenantIds = [...new Set(rows.map((r) => r.tenantId))];

  const out: TenantOutcome[] = [];
  for (const tenantId of tenantIds) {
    try {
      // don't pile a second run on top of one still in flight (short schedules + slow API)
      const inFlight = await masterDb.syncRun.findFirst({
        where: { tenantId, status: "running", startedAt: { gt: new Date(Date.now() - RUNNING_LOCK_MS) } },
        select: { id: true },
      });
      if (inFlight) {
        out.push({ tenantId, status: "skipped", rows: 0, error: "sync anterior ainda em execução" });
        continue;
      }

      const res = await syncTenant(tenantId, new Date(), { dailyDays: DAILY_DAYS });
      out.push({
        tenantId,
        status: res.status,
        rows: res.rowsUpserted,
        ...(res.error ? { error: res.error } : {}),
      });
    } catch (e) {
      out.push({ tenantId, status: "error", rows: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

/** Scheduled sync of every tenant with an active Softcom connection. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const tenants = await runAll();
  const failed = tenants.filter((t) => t.status === "error").length;

  console.log(
    `[cron/sync] ${tenants.length} tenant(s) — ${tenants.length - failed} ok, ${failed} com erro, ${Date.now() - startedAt}ms`,
  );

  return NextResponse.json({
    ok: failed === 0,
    durationMs: Date.now() - startedAt,
    dailyDays: DAILY_DAYS,
    tenants,
  });
}

/** Same job over POST, for schedulers that only send POST. */
export const POST = GET;
