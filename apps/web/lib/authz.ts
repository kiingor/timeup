import { getSessionUser } from "@/lib/session";
import type { SessionUser } from "@timeup/core";

/** Throws (not redirect) — for use inside server actions that return typed errors. */
export async function assertMaster(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "master") throw new Error("Não autorizado.");
  return user;
}

export async function assertAdmin(): Promise<SessionUser & { tenantId: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin" || !user.tenantId) throw new Error("Não autorizado.");
  return user as SessionUser & { tenantId: string };
}

export async function assertColaborador(): Promise<SessionUser & { tenantId: string; colaboradorId: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "colaborador" || !user.tenantId || !user.colaboradorId) {
    throw new Error("Não autorizado.");
  }
  return user as SessionUser & { tenantId: string; colaboradorId: string };
}
