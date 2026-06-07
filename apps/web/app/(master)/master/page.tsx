import Link from "next/link";
import { Building2, CheckCircle2, Users, ShieldCheck, Plus, ArrowUpRight } from "lucide-react";
import { requireMaster } from "@/lib/session";
import { getMasterOverview, listTenants } from "@/lib/data/master";
import { listRecentAudit } from "@/lib/data/users";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function MasterOverview() {
  await requireMaster();
  const [overview, tenants, audit] = await Promise.all([getMasterOverview(), listTenants(), listRecentAudit(6)]);
  const recent = tenants.slice(0, 6);
  const dt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div>
      <PageHeader title="Visão geral" badge="master" description="Gerencie as empresas da plataforma TimeUp.">
        <Button asChild>
          <Link href="/master/empresas/nova">
            <Plus className="size-4" />
            Nova empresa
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} tone="brand" label="Empresas" value={overview.tenants} hint={`${overview.active} ativas`} />
        <StatCard icon={CheckCircle2} tone="success" label="Empresas ativas" value={overview.active} />
        <StatCard icon={Users} tone="info" label="Colaboradores" value={overview.colaboradores} />
        <StatCard icon={ShieldCheck} tone="pink" label="Administradores" value={overview.admins} />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Empresas recentes</h2>
          <Link href="/master/empresas" className="text-sm font-semibold text-brand hover:underline">
            Ver todas
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="grid place-items-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma empresa ainda.</p>
            <Button asChild className="mt-3">
              <Link href="/master/empresas/nova">
                <Plus className="size-4" />
                Criar a primeira empresa
              </Link>
            </Button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-3 border-b border-border pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Empresa</span>
              <span>Status</span>
              <span>Colaboradores</span>
              <span className="justify-self-end">Softcom</span>
            </div>
            {recent.map((t) => (
              <Link
                key={t.id}
                href={`/master/empresas/${t.id}`}
                className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-3 border-t border-border py-3 transition-colors first:border-t-0 hover:bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-brand/15 text-xs text-brand">{initials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{t.slug}</p>
                  </div>
                </div>
                <span>
                  {t.status === "active" ? (
                    <Badge variant="success">Ativa</Badge>
                  ) : (
                    <Badge variant="warning">Suspensa</Badge>
                  )}
                </span>
                <span className="text-sm font-semibold tabnums">{t._count.colaboradores}</span>
                <span className="justify-self-end">
                  {t.softcomConnections.some((c) => c.enabled) ? (
                    <Badge variant="success">Conectado</Badge>
                  ) : (
                    <Badge variant="secondary">—</Badge>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {audit.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-1 text-lg font-bold">Atividade recente</h2>
          {audit.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-sm first:border-t-0">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{a.actor?.name ?? "Sistema"}</span> {a.action} {a.entity}
                {a.tenant?.name ? ` • ${a.tenant.name}` : ""}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{dt.format(a.createdAt)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
