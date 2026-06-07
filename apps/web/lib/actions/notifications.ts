"use server";

import { revalidatePath } from "next/cache";
import { getTenantDb } from "@timeup/db";
import { notificationSchema, type NotificationInput } from "@timeup/core";
import { assertAdmin, assertColaborador } from "@/lib/authz";

export type NotifResult = { ok: true } | { ok: false; error: string };

/** Admin creates a notification for one colaborador (colaboradorId) or all (null). */
export async function createNotification(input: NotificationInput): Promise<NotifResult> {
  let user;
  try {
    user = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const db = getTenantDb(user.tenantId);
  // if targeting a specific colaborador, make sure it belongs to this tenant
  if (parsed.data.colaboradorId) {
    const exists = await db.colaborador.findFirst({ where: { id: parsed.data.colaboradorId }, select: { id: true } });
    if (!exists) return { ok: false, error: "Colaborador não encontrado." };
  }
  await db.notification.create({
    data: {
      tenantId: user.tenantId,
      colaboradorId: parsed.data.colaboradorId,
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      createdById: user.userId,
    },
  });
  revalidatePath("/app/notificacoes");
  return { ok: true };
}

/** Colaborador marks a single notification as read. */
export async function markNotificationRead(notificationId: string): Promise<NotifResult> {
  let user;
  try {
    user = await assertColaborador();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  const db = getTenantDb(user.tenantId);
  // confirm the notification is visible to this colaborador (their own or broadcast)
  const notif = await db.notification.findFirst({
    where: { id: notificationId, OR: [{ colaboradorId: user.colaboradorId }, { colaboradorId: null }] },
    select: { id: true },
  });
  if (!notif) return { ok: false, error: "Notificação não encontrada." };
  await db.notificationRead.upsert({
    where: { notificationId_colaboradorId: { notificationId, colaboradorId: user.colaboradorId } },
    update: {},
    create: { notificationId, colaboradorId: user.colaboradorId },
  });
  revalidatePath("/me", "layout");
  return { ok: true };
}

/** Colaborador marks all currently-visible notifications as read. */
export async function markAllNotificationsRead(): Promise<NotifResult> {
  let user;
  try {
    user = await assertColaborador();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  const db = getTenantDb(user.tenantId);
  const unread = await db.notification.findMany({
    where: {
      OR: [{ colaboradorId: user.colaboradorId }, { colaboradorId: null }],
      reads: { none: { colaboradorId: user.colaboradorId } },
    },
    select: { id: true },
  });
  if (unread.length > 0) {
    await db.notificationRead.createMany({
      data: unread.map((n) => ({ notificationId: n.id, colaboradorId: user.colaboradorId })),
      skipDuplicates: true,
    });
  }
  revalidatePath("/me", "layout");
  return { ok: true };
}
