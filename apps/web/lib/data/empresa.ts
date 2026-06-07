import { getTenantDb } from "@timeup/db";

export interface EmpresaItem {
  id: string;
  name: string;
  cnpj: string | null;
  softcomEmpresaId: number;
}

/** Active empresas of a tenant — feeds the admin empresa filter + colaborador form. */
export async function listEmpresas(tenantId: string): Promise<EmpresaItem[]> {
  const rows = await getTenantDb(tenantId).empresa.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, cnpj: true, softcomEmpresaId: true },
  });
  return rows;
}
