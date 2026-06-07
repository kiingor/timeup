import Link from "next/link";
import { Plus, Users, ArrowUpRight } from "lucide-react";
import { normalizeTheme, type ThemeTokens } from "@timeup/core";
import { requireMaster } from "@/lib/session";
import { listTenants } from "@/lib/data/master";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function EmpresasPage() {
  await requireMaster();
  const tenants = await listTenants();

  return (
    <div>
      <PageHeader title="Empresas" description="Todas as empresas (tenants) da plataforma.">
        <Button asChild>
          <Link href="/master/empresas/nova">
            <Plus className="size-4" />
            Nova empresa
          </Link>
        </Button>
      </PageHeader>

      {tenants.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card py-24 text-center">
          <p className="font-semibold">Nenhuma empresa cadastrada</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie a primeira empresa para começar.</p>
          <Button asChild className="mt-4">
            <Link href="/master/empresas/nova">
              <Plus className="size-4" />
              Nova empresa
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tenants.map((t) => {
            const theme: ThemeTokens = normalizeTheme(t.theme as Partial<ThemeTokens>);
            return (
              <Link
                key={t.id}
                href={`/master/empresas/${t.id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-card"
              >
                <div
                  className="h-20"
                  style={{ background: `linear-gradient(120deg, ${theme.brand}, color-mix(in srgb, ${theme.brand} 75%, #000))` }}
                />
                <div className="p-5">
                  <div className="-mt-10 mb-3 flex items-end justify-between">
                    <span
                      className="grid size-12 place-items-center rounded-xl text-lg font-extrabold text-white ring-4 ring-card"
                      style={{ backgroundColor: theme.brand }}
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                    <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-brand" />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold">{t.name}</p>
                    {t.status === "active" ? (
                      <Badge variant="success">Ativa</Badge>
                    ) : (
                      <Badge variant="warning">Suspensa</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">/{t.slug}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-4" />
                      {t._count.colaboradores} colaboradores
                    </span>
                    {t.softcomConnections.some((c) => c.enabled) ? (
                      <Badge variant="success">Softcom · {t._count.empresas} empresa(s)</Badge>
                    ) : (
                      <Badge variant="secondary">Sem Softcom</Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
