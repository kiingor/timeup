"use server";

import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import { masterDb } from "@timeup/db";
import { assertAdmin } from "@/lib/authz";

export type UserResult = { ok: true } | { ok: false; error: string };

/** Creates an additional admin user for the current tenant. */
export async function createAdminUser(input: { name: string; email: string; password: string }): Promise<UserResult> {
  let user;
  try {
    user = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!name || name.length < 2) return { ok: false, error: "Informe o nome." };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "E-mail inválido." };
  if (!input.password || input.password.length < 8) return { ok: false, error: "A senha deve ter ao menos 8 caracteres." };

  const taken = await masterDb.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return { ok: false, error: "Já existe um usuário com este e-mail." };

  await masterDb.user.create({
    data: { tenantId: user.tenantId, role: "admin", email, name, passwordHash: await hash(input.password) },
  });
  revalidatePath("/app/configuracoes/usuarios");
  return { ok: true };
}
