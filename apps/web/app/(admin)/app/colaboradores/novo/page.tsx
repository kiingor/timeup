import { requireAdmin } from "@/lib/session";
import { listEmpresas } from "@/lib/data/empresa";
import { PageHeader } from "@/components/page-header";
import { ColaboradorForm } from "@/components/forms/colaborador-form";

export default async function NovoColaboradorPage() {
  const user = await requireAdmin();
  const empresas = await listEmpresas(user.tenantId);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Novo colaborador" description="Cadastre um membro da equipe." />
      <ColaboradorForm mode="create" empresas={empresas} />
    </div>
  );
}
