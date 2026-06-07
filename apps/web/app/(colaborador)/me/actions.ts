"use server";

import { revalidatePath } from "next/cache";
import { hash, verify } from "@node-rs/argon2";
import { masterDb, getTenantDb } from "@timeup/db";
import { getSessionUser } from "@/lib/session";
import { assertColaborador } from "@/lib/authz";
import { VEHICLES } from "@/components/vehicles/pixel-vehicle";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Lets the colaborador pick their race vehicle (validated against the known list). */
export async function setVehicle(vehicleId: string): Promise<ActionResult> {
  let user;
  try {
    user = await assertColaborador();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  if (!VEHICLES.some((v) => v.id === vehicleId)) return { ok: false, error: "Veículo inválido." };
  const db = getTenantDb(user.tenantId);
  await db.colaborador.update({ where: { id: user.colaboradorId }, data: { vehicle: vehicleId } });
  revalidatePath("/me/perfil");
  revalidatePath("/me/ranking");
  return { ok: true };
}

/** Lets the signed-in user change their own password. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Não autorizado." };
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "A nova senha deve ter ao menos 8 caracteres." };
  }
  const u = await masterDb.user.findUnique({ where: { id: session.userId } });
  if (!u) return { ok: false, error: "Usuário não encontrado." };

  const ok = await verify(u.passwordHash, currentPassword);
  if (!ok) return { ok: false, error: "Senha atual incorreta." };

  await masterDb.user.update({ where: { id: u.id }, data: { passwordHash: await hash(newPassword) } });
  return { ok: true };
}
