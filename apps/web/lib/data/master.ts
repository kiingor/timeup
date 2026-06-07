import { masterDb } from "@timeup/db";

export async function getMasterOverview() {
  const [tenants, active, colaboradores, admins, recentSyncs] = await Promise.all([
    masterDb.tenant.count(),
    masterDb.tenant.count({ where: { status: "active" } }),
    masterDb.colaborador.count(),
    masterDb.user.count({ where: { role: "admin" } }),
    masterDb.syncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { tenant: { select: { name: true } } },
    }),
  ]);
  return { tenants, active, suspended: tenants - active, colaboradores, admins, recentSyncs };
}

export async function listTenants() {
  return masterDb.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { colaboradores: true, users: true, empresas: true } },
      empresas: { select: { name: true, cnpj: true }, orderBy: { name: "asc" } },
      softcomConnections: { select: { enabled: true } },
    },
  });
}

export type TenantListItem = Awaited<ReturnType<typeof listTenants>>[number];

export async function getTenantDetail(id: string) {
  return masterDb.tenant.findUnique({
    where: { id },
    include: {
      softcomConnections: { orderBy: { createdAt: "asc" } },
      empresas: { orderBy: { name: "asc" } },
      users: { where: { role: "admin" }, orderBy: { createdAt: "asc" } },
      _count: { select: { colaboradores: true, metaTiers: true } },
    },
  });
}
