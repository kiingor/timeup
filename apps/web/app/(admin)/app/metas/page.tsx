import Link from "next/link";
import { Target, Pencil, Settings2 } from "lucide-react";
import { formatBRL, formatPct } from "@timeup/core";
import { requireAdmin } from "@/lib/session";
import { getMetasOverview } from "@/lib/data/metas";
import { listEmpresas } from "@/lib/data/empresa";
import { parsePeriod, parseEmpresa, periodLabel } from "@/lib/period";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MonthSelector } from "@/components/month-selector";
import { EmpresaSelector } from "@/components/empresa-selector";
import { StoreGoalForm } from "@/components/forms/store-goal-form";

export default async function MetasPage({ searchParams }: { searchParams: Promise<{ ano?: string; mes?: string; empresa?: string }> }) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const { year, month } = parsePeriod(sp);
  const empresaId = parseEmpresa(sp);
  const [empresas, data] = await Promise.all([
    listEmpresas(user.tenantId),
    getMetasOverview(user.tenantId, year, month, empresaId),
  ]);

  const cols = `1.6fr ${data.tiers.map(() => "1fr").join(" ")} 0.8fr auto`;

  return (
    <div>
      <PageHeader title="Metas" description={`Metas de ${periodLabel(year, month)}.`}>
        <Button asChild variant="outline">
          <Link href="/app/configuracoes/metas">
            <Settings2 className="size-4" />
            Níveis
          </Link>
        </Button>
        <EmpresaSelector empresas={empresas} selected={empresaId} />
        <MonthSelector year={year} month={month} />
      </PageHeader>

      <section className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand/12 text-brand">
              <Target className="size-5" />
            </span>
            <div>
              <h2 className="font-bold">Meta da loja</h2>
              <p className="text-sm text-muted-foreground">Faturamento alvo do mês inteiro.</p>
            </div>
          </div>
          <StoreGoalForm year={year} month={month} initial={data.storeGoal} empresaId={empresaId} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-3 text-lg font-bold">Metas por colaborador</h2>

        {data.rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum colaborador ativo.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid items-center gap-3 border-b border-border pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ gridTemplateColumns: cols }}>
                <span>Colaborador</span>
                {data.tiers.map((t) => (
                  <span key={t.id} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: t.color ?? "var(--brand)" }} />
                    {t.name}
                  </span>
                ))}
                <span>%</span>
                <span />
              </div>
              {data.rows.map((row) => (
                <div key={row.id} className="grid items-center gap-3 border-t border-border py-3 first:border-t-0" style={{ gridTemplateColumns: cols }}>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-secondary text-xs">{initials(row.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-semibold">{row.name}</span>
                  </div>
                  {data.tiers.map((t) => {
                    const v = row.targets[t.id] ?? 0;
                    return (
                      <span key={t.id} className={`text-sm tabnums ${v > 0 ? "font-semibold" : "text-muted-foreground"}`}>
                        {v > 0 ? formatBRL(v) : "—"}
                      </span>
                    );
                  })}
                  <span className="text-sm font-bold tabnums text-brand">{formatPct(row.referencePct)}</span>
                  <Button asChild size="sm" variant="ghost" className="justify-self-end">
                    <Link href={`/app/colaboradores/${row.id}?ano=${year}&mes=${month}`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
