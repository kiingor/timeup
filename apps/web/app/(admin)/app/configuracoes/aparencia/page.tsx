import { requireAdmin } from "@/lib/session";
import { getTenantTheme } from "@/lib/data/tenant";
import { PageHeader } from "@/components/page-header";
import { AparenciaForm } from "./aparencia-form";

export default async function AparenciaPage() {
  const user = await requireAdmin();
  const theme = await getTenantTheme(user.tenantId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Aparência" description="Cores e logo da sua empresa." />
      <AparenciaForm initialTheme={theme} />
    </div>
  );
}
