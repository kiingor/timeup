import { requireAdmin } from "@/lib/session";
import { getMetaTiers } from "@/lib/data/metas";
import { PageHeader } from "@/components/page-header";
import { TiersManager } from "@/components/forms/tiers-manager";

export default async function ConfigMetasPage() {
  const user = await requireAdmin();
  const tiers = await getMetaTiers(user.tenantId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Níveis de meta" description="Configure os níveis usados nas metas dos colaboradores." />
      <TiersManager tiers={tiers.map((t) => ({ id: t.id, name: t.name, color: t.color, active: t.active }))} />
    </div>
  );
}
