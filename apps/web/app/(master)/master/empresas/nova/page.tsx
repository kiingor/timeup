import { requireMaster } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { NewTenantForm } from "./new-tenant-form";

export default async function NovaEmpresaPage() {
  await requireMaster();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Nova empresa" description="Cadastre uma empresa, seu admin e a identidade visual." />
      <NewTenantForm />
    </div>
  );
}
