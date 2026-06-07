import { NextResponse } from "next/server";
import { syncTenant } from "@timeup/softcom";

/** Internal sync trigger, protected by a shared secret. Used by the worker / cron. */
export async function POST(req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const secret = req.headers.get("x-internal-secret");
  if (!process.env.INTERNAL_SYNC_SECRET || secret !== process.env.INTERNAL_SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;
  const res = await syncTenant(tenantId);
  return NextResponse.json(res, { status: res.status === "error" ? 500 : 200 });
}
