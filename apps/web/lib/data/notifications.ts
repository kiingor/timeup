import { getTenantDb } from "@timeup/db";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string; // ISO
  read: boolean;
}

/** Notifications visible to a colaborador: those targeted at them OR at everyone (null). */
export async function getColaboradorNotifications(
  tenantId: string,
  colaboradorId: string,
  take = 20,
): Promise<{ items: NotificationItem[]; unread: number }> {
  const db = getTenantDb(tenantId);
  const rows = await db.notification.findMany({
    where: { OR: [{ colaboradorId }, { colaboradorId: null }] },
    orderBy: { createdAt: "desc" },
    take,
    include: { reads: { where: { colaboradorId }, select: { id: true } } },
  });
  const items = rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    read: n.reads.length > 0,
  }));
  return { items, unread: items.filter((i) => !i.read).length };
}

export interface AdminNotificationRow {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  targetName: string; // "Todos" or the colaborador's name
}

/** Recent notifications sent in this tenant, for the admin management page. */
export async function listAdminNotifications(tenantId: string, take = 30): Promise<AdminNotificationRow[]> {
  const db = getTenantDb(tenantId);
  const rows = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { colaborador: { select: { name: true } } },
  });
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    targetName: n.colaborador?.name ?? "Todos os colaboradores",
  }));
}
