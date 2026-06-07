import { NextResponse } from "next/server";
import { masterDb } from "@timeup/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic: surfaces the exact DB/argon2 error to debug the Vercel deploy.
export async function GET() {
  const out: Record<string, unknown> = { status: "ok", time: new Date().toISOString() };
  try {
    out.userCount = await masterDb.user.count();
    out.db = "ok";
  } catch (e) {
    out.db = "ERROR";
    out.dbError = String(e instanceof Error ? e.message : e).slice(0, 900);
  }
  try {
    const argon2 = await import("@node-rs/argon2");
    out.argon2 = typeof argon2.verify === "function" ? "loaded" : "missing";
  } catch (e) {
    out.argon2 = "ERROR: " + String(e instanceof Error ? e.message : e).slice(0, 300);
  }
  return NextResponse.json(out);
}
