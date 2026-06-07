import { masterDb } from "@timeup/db";

export async function listTenantUsers(tenantId: string) {
  return masterDb.user.findMany({
    where: { tenantId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true },
  });
}

export async function listAllUsers() {
  return masterDb.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    include: { tenant: { select: { name: true } } },
  });
}

export async function listRecentAudit(limit = 8) {
  return masterDb.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { tenant: { select: { name: true } }, actor: { select: { name: true } } },
  });
}
