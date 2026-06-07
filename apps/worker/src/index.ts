import { config } from "dotenv";
import { resolve } from "node:path";
import cron from "node-cron";
import { masterDb } from "@timeup/db";
import { syncTenant } from "@timeup/softcom";

// load the workspace-root .env (DATABASE_URL, MASTER_ENCRYPTION_KEY, SOFTCOM_MOCK)
config({ path: resolve(process.cwd(), "../../.env") });

async function runAll() {
  // distinct tenants that have at least one enabled connection (one device per empresa)
  const rows = await masterDb.tenantSoftcomConfig.findMany({
    where: { enabled: true },
    select: { tenantId: true },
  });
  const tenantIds = [...new Set(rows.map((r) => r.tenantId))];
  console.log(`[worker] sync run — ${tenantIds.length} tenant(s) habilitado(s)`);
  for (const tenantId of tenantIds) {
    try {
      const r = await syncTenant(tenantId);
      console.log(`[worker] tenant ${tenantId}: ${r.status} (${r.rowsUpserted} linhas)`);
    } catch (e) {
      console.error(`[worker] tenant ${tenantId} falhou`, e);
    }
  }
}

console.log("[timeup-worker] iniciado.");
runAll().catch(console.error);

// every 15 minutes
cron.schedule("*/15 * * * *", () => {
  runAll().catch(console.error);
});
