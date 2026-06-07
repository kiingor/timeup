"use server";

import { revalidatePath } from "next/cache";
import { syncHistory } from "@timeup/softcom";
import { assertAdmin } from "@/lib/authz";

export type BackfillTriggerResult = { ok: true; months: number; ok_count: number } | { ok: false; error: string };

/** Re-pull the last N months from Softcom so the analytics reflect current history. */
export async function triggerBackfill(months = 6): Promise<BackfillTriggerResult> {
  let user;
  try {
    user = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  const res = await syncHistory(user.tenantId, months);
  revalidatePath("/app/desempenho");
  revalidatePath("/app");
  return { ok: true, months: res.months.length, ok_count: res.ok };
}
