import { TrendingUp, Receipt, ShoppingBag, BarChart3, Users } from "lucide-react";
import { formatBRL } from "@timeup/core";
import { requireAdmin } from "@/lib/session";
import { getDesempenho } from "@/lib/data/desempenho";
import { listEmpresas } from "@/lib/data/empresa";
import { parseEmpresa } from "@/lib/period";
import { DeltaKpiCard } from "@/components/desempenho/delta-kpi-card";
import { FaturamentoMetaChart } from "@/components/charts/faturamento-meta";
import { ColabComparisonBar } from "@/components/charts/colab-comparison-bar";
import { EmpresaSelector } from "@/components/empresa-selector";
import { BackfillButton } from "./backfill-button";

function EmptyPanel({ icon: Icon, label }: { icon: typeof BarChart3; label: string }) {
  return (
    <div className="grid h-[200px] place-items-center rounded-xl border border-dashed border-border text-center">
      <div>
        <Icon className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function DesempenhoPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const user = await requireAdmin();
  const empresaId = parseEmpresa(await searchParams);
  const [empresas, d] = await Promise.all([listEmpresas(user.tenantId), getDesempenho(user.tenantId, empresaId)]);

  const isPartial = d.months[d.months.length - 1]?.partial ?? false;

  return (
    <div className="flex flex-col gap-6">
      {empresas.length > 1 && (
        <div className="flex justify-end">
          <EmpresaSelector empresas={empresas} selected={empresaId} />
        </div>
      )}
      {/* hero — headline faturamento vs mês anterior */}
      <section className="relative overflow-hidden rounded-3xl bg-hero p-8 text-white">
        <svg className="pointer-events-none absolute -right-6 top-1 h-52 w-52 text-white/12" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0 L57 43 L100 50 L57 57 L50 100 L43 57 L0 50 L43 43 Z" />
        </svg>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Desempenho • {d.periodLabel}</p>
            <p className="mt-3 text-sm font-medium text-white/75">Faturamento do mês</p>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-4xl font-extrabold tabnums leading-none">{formatBRL(d.deltas.faturamento.current)}</span>
              {isPartial && (
                <span className="mb-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                  parcial
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-white/75">
              Mês anterior: <span className="font-semibold tabnums text-white">{formatBRL(d.deltas.faturamento.prev)}</span>
            </p>
          </div>
          <BackfillButton />
        </div>
      </section>

      {/* delta KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DeltaKpiCard icon={TrendingUp} tone="brand" label="Faturamento" kind="money" delta={d.deltas.faturamento} partial={isPartial} />
        <DeltaKpiCard icon={Receipt} tone="info" label="Ticket médio" kind="money" delta={d.deltas.ticketMedio} partial={false} />
        <DeltaKpiCard icon={ShoppingBag} tone="pink" label="Qtd. de vendas" kind="count" delta={d.deltas.salesCount} partial={isPartial} />
      </div>

      {/* store faturamento vs meta */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold leading-tight">Faturamento da loja vs meta</h2>
            <p className="text-xs text-muted-foreground">Realizado por mês comparado à meta da loja.</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand" /> Realizado</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3.5 rounded-full bg-pink" /> Meta</span>
            {isPartial && <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand/35" /> Parcial</span>}
          </div>
        </div>
        {d.hasData ? <FaturamentoMetaChart data={d.months} /> : <EmptyPanel icon={BarChart3} label="Ainda não há histórico de vendas. Clique em Sincronizar histórico." />}
      </section>

      {/* ranked colaborador comparison */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold leading-tight">Top colaboradores</h2>
            <p className="text-xs text-muted-foreground">
              Realizado em {d.periodLabel}{isPartial ? " (parcial)" : ""}.
            </p>
          </div>
        </div>
        {d.colaboradores.length > 0 ? (
          <ColabComparisonBar data={d.colaboradores.map((c) => ({ name: c.name, realized: c.currentRealized, rank: c.currentRank }))} />
        ) : (
          <EmptyPanel icon={Users} label="Nenhum colaborador com vendas no período." />
        )}
      </section>

      {/* tier attainment (current month) — same language as the Resumo da loja */}
      {d.tierStats.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-bold leading-tight">Metas atingidas</h2>
          <p className="mb-4 text-xs text-muted-foreground">Colaboradores por nível em {d.periodLabel}.</p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.tierStats.map((t) => {
              const ratio = t.totalWithGoal > 0 ? t.reachedCount / t.totalWithGoal : 0;
              return (
                <div key={t.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </span>
                    <span className="tabnums font-bold" style={{ color: t.color }}>
                      {t.reachedCount}
                      <span className="text-muted-foreground">/{t.totalWithGoal}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${ratio * 100}%`, backgroundColor: t.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
