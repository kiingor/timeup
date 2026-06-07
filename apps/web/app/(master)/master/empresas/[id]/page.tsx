import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Layers, ShieldCheck, Plug } from "lucide-react";
import { normalizeTheme, type ThemeTokens } from "@timeup/core";
import { requireMaster } from "@/lib/session";
import { getTenantDetail } from "@/lib/data/master";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { EditTenantForm } from "./edit-tenant-form";

export default async function EmpresaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMaster();
  const { id } = await params;
  const tenant = await getTenantDetail(id);
  if (!tenant) notFound();

  const theme: ThemeTokens = normalizeTheme(tenant.theme as Partial<ThemeTokens>);
  const admin = tenant.users[0];

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/master/empresas" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Empresas
      </Link>

      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="h-24" style={{ background: `linear-gradient(120deg, ${theme.brand}, color-mix(in srgb, ${theme.brand} 75%, #000))` }} />
        <div className="flex items-end justify-between p-5">
          <div className="-mt-12 flex items-end gap-3">
            <span className="grid size-16 place-items-center rounded-2xl text-2xl font-extrabold text-white ring-4 ring-card" style={{ backgroundColor: theme.brand }}>
              {tenant.name.charAt(0).toUpperCase()}
            </span>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold">{tenant.name}</h1>
                {tenant.status === "active" ? <Badge variant="success">Ativa</Badge> : <Badge variant="warning">Suspensa</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} tone="info" label="Colaboradores" value={tenant._count.colaboradores} />
        <StatCard icon={Layers} tone="brand" label="Níveis de meta" value={tenant._count.metaTiers} />
        <StatCard icon={ShieldCheck} tone="pink" label="Admin" value={admin ? "1" : "0"} hint={admin?.email} />
        <StatCard
          icon={Plug}
          tone={tenant.softcomConnections.some((c) => c.enabled) ? "success" : "warning"}
          label="Softcom"
          value={tenant.softcomConnections.some((c) => c.enabled) ? "Conectado" : "Pendente"}
          hint={tenant.empresas.map((e) => e.name).join(", ") || undefined}
        />
      </div>

      <EditTenantForm id={tenant.id} initialName={tenant.name} initialActive={tenant.status === "active"} initialTheme={theme} />

      <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground shadow-soft">
        A finalização da integração Softcom (provisionamento do device) e a redefinição de senha do admin chegam no M4.
      </div>
    </div>
  );
}
