"use server";

import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import { getTenantDb, masterDb } from "@timeup/db";
import {
  colaboradorSchema,
  metaTierSchema,
  storeGoalSchema,
  colaboradorGoalsSchema,
  type ColaboradorInput,
  type MetaTierInput,
} from "@timeup/core";
import { assertAdmin } from "@/lib/authz";
import { writeAudit } from "@/lib/audit";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/* ----------------------------- Colaboradores ----------------------------- */

export async function createColaborador(input: ColaboradorInput): Promise<ActionResult> {
  const user = await assertAdmin();
  const parsed = colaboradorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;
  const db = getTenantDb(user.tenantId);

  const wantsLogin = data.createLogin === true;
  const email = data.email && data.email.trim() ? data.email.trim().toLowerCase() : null;
  if (wantsLogin && (!email || !data.loginPassword)) {
    return { ok: false, error: "Para criar login, informe e-mail e senha." };
  }
  if (wantsLogin && email) {
    const taken = await masterDb.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) return { ok: false, error: "Já existe um usuário com este e-mail." };
  }

  try {
    const colab = await db.colaborador.create({
      data: {
        tenantId: user.tenantId,
        empresaId: data.empresaId,
        name: data.name,
        email,
        active: data.active,
        softcomVendedorId: data.softcomVendedorId?.trim() || null,
        softcomVendedorNome: data.softcomVendedorNome?.trim() || null,
      },
    });

    if (wantsLogin && email && data.loginPassword) {
      await masterDb.user.create({
        data: {
          tenantId: user.tenantId,
          role: "colaborador",
          email,
          passwordHash: await hash(data.loginPassword),
          name: data.name,
          colaboradorId: colab.id,
        },
      });
    }

    await writeAudit(user.tenantId, user.userId, "create", "colaborador", colab.id, { name: data.name });
    revalidatePath("/app/colaboradores");
    return { ok: true, id: colab.id };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { ok: false, error: "Este vendedor Softcom já está vinculado a outro colaborador." };
    }
    return { ok: false, error: "Não foi possível criar o colaborador." };
  }
}

export async function updateColaborador(id: string, input: ColaboradorInput): Promise<ActionResult> {
  const user = await assertAdmin();
  const parsed = colaboradorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;
  const db = getTenantDb(user.tenantId);
  const email = data.email && data.email.trim() ? data.email.trim().toLowerCase() : null;

  try {
    const current = await db.colaborador.findUnique({ where: { id }, select: { empresaId: true } });
    if (!current) return { ok: false, error: "Colaborador não encontrado." };
    const empresaChanged = current.empresaId !== data.empresaId;

    await db.colaborador.update({
      where: { id },
      data: {
        empresaId: data.empresaId,
        name: data.name,
        email,
        active: data.active,
        softcomVendedorId: data.softcomVendedorId?.trim() || null,
        softcomVendedorNome: data.softcomVendedorNome?.trim() || null,
      },
    });

    // Admin moved the colaborador to another empresa: re-key their owned rows so all of
    // the colaborador's data lives under one empresa. Next sync repopulates via the new
    // empresa's connection (the vendedor link is per-connection — re-link in the picker).
    if (empresaChanged) {
      await Promise.all([
        db.salesDaily.updateMany({ where: { colaboradorId: id }, data: { empresaId: data.empresaId } }),
        db.salesMonthly.updateMany({ where: { colaboradorId: id }, data: { empresaId: data.empresaId } }),
        db.colaboradorGoal.updateMany({ where: { colaboradorId: id }, data: { empresaId: data.empresaId } }),
      ]);
    }

    // optionally provision a login if requested and none exists yet
    if (data.createLogin && email && data.loginPassword) {
      const existing = await masterDb.user.findFirst({ where: { colaboradorId: id } });
      if (!existing) {
        const taken = await masterDb.user.findUnique({ where: { email }, select: { id: true } });
        if (taken) return { ok: false, error: "Já existe um usuário com este e-mail." };
        await masterDb.user.create({
          data: {
            tenantId: user.tenantId,
            role: "colaborador",
            email,
            passwordHash: await hash(data.loginPassword),
            name: data.name,
            colaboradorId: id,
          },
        });
      }
    }

    revalidatePath("/app/colaboradores");
    revalidatePath(`/app/colaboradores/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Não foi possível atualizar o colaborador." };
  }
}

export async function deleteColaborador(id: string): Promise<ActionResult> {
  const user = await assertAdmin();
  const db = getTenantDb(user.tenantId);
  try {
    // remove the colaborador's login first (relation is SetNull — would otherwise orphan a
    // colaborador-user with no colaborador), then the colaborador (cascades goals + sales).
    await masterDb.user.deleteMany({ where: { tenantId: user.tenantId, colaboradorId: id } });
    await db.colaborador.delete({ where: { id } });
    await writeAudit(user.tenantId, user.userId, "delete", "colaborador", id, {});
    revalidatePath("/app/colaboradores");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir o colaborador." };
  }
}

/* ------------------------------- Meta tiers ------------------------------ */

export async function createMetaTier(input: MetaTierInput): Promise<ActionResult> {
  const user = await assertAdmin();
  const db = getTenantDb(user.tenantId);
  const parsed = metaTierSchema.partial({ orderIndex: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const last = await db.metaTier.findFirst({ orderBy: { orderIndex: "desc" } });
  await db.metaTier.create({
    data: {
      tenantId: user.tenantId,
      name: parsed.data.name,
      color: parsed.data.color ?? null,
      active: parsed.data.active ?? true,
      orderIndex: (last?.orderIndex ?? 0) + 1,
    },
  });
  revalidatePath("/app/configuracoes/metas");
  return { ok: true };
}

export async function updateMetaTier(
  id: string,
  input: { name: string; color?: string | null; active: boolean },
): Promise<ActionResult> {
  const user = await assertAdmin();
  const db = getTenantDb(user.tenantId);
  if (!input.name || input.name.trim().length < 1) return { ok: false, error: "Informe o nome do nível." };
  await db.metaTier.update({ where: { id }, data: { name: input.name.trim(), color: input.color ?? null, active: input.active } });
  revalidatePath("/app/configuracoes/metas");
  return { ok: true };
}

export async function deleteMetaTier(id: string): Promise<ActionResult> {
  const user = await assertAdmin();
  const db = getTenantDb(user.tenantId);
  try {
    await db.metaTier.delete({ where: { id } });
    revalidatePath("/app/configuracoes/metas");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não é possível remover um nível com metas já cadastradas. Desative-o." };
  }
}

/* --------------------------------- Goals --------------------------------- */

export async function setStoreGoal(empresaId: string, year: number, month: number, targetBrl: number): Promise<ActionResult> {
  const user = await assertAdmin();
  const parsed = storeGoalSchema.safeParse({ year, month, targetBrl });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Valor inválido." };
  if (!empresaId) return { ok: false, error: "Selecione uma empresa para definir a meta da loja." };
  const db = getTenantDb(user.tenantId);
  // confirm the empresa belongs to this tenant
  const empresa = await db.empresa.findUnique({ where: { id: empresaId }, select: { id: true } });
  if (!empresa) return { ok: false, error: "Empresa inválida." };
  await db.monthlyStoreGoal.upsert({
    where: { tenantId_empresaId_periodYear_periodMonth: { tenantId: user.tenantId, empresaId, periodYear: year, periodMonth: month } },
    update: { targetBrl },
    create: { tenantId: user.tenantId, empresaId, periodYear: year, periodMonth: month, targetBrl, createdById: user.userId },
  });
  revalidatePath("/app/metas");
  revalidatePath("/app");
  return { ok: true };
}

export async function setColaboradorGoals(
  colaboradorId: string,
  year: number,
  month: number,
  tiers: { metaTierId: string; targetBrl: number; bonusBrl?: number | null }[],
): Promise<ActionResult> {
  const user = await assertAdmin();
  const parsed = colaboradorGoalsSchema.safeParse({ colaboradorId, year, month, tiers });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const db = getTenantDb(user.tenantId);

  // ColaboradorGoal carries a denormalized empresaId (= the colaborador's empresa)
  const colab = await db.colaborador.findUnique({ where: { id: colaboradorId }, select: { empresaId: true } });
  if (!colab) return { ok: false, error: "Colaborador não encontrado." };
  const empresaId = colab.empresaId;

  await Promise.all(
    parsed.data.tiers.map((t) => {
      const bonus = t.bonusBrl && t.bonusBrl > 0 ? t.bonusBrl : null;
      return db.colaboradorGoal.upsert({
        where: {
          tenantId_colaboradorId_metaTierId_periodYear_periodMonth: {
            tenantId: user.tenantId,
            colaboradorId,
            metaTierId: t.metaTierId,
            periodYear: year,
            periodMonth: month,
          },
        },
        update: { targetBrl: t.targetBrl, bonusBrl: bonus },
        create: {
          tenantId: user.tenantId,
          empresaId,
          colaboradorId,
          metaTierId: t.metaTierId,
          periodYear: year,
          periodMonth: month,
          targetBrl: t.targetBrl,
          bonusBrl: bonus,
          createdById: user.userId,
        },
      });
    }),
  );

  revalidatePath("/app/metas");
  revalidatePath(`/app/colaboradores/${colaboradorId}`);
  revalidatePath("/app");
  return { ok: true };
}
