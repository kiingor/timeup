import Link from "next/link";
import { ArrowRight, MoreHorizontal, TrendingUp, Target, Receipt, ChevronLeft, ChevronRight, Plus, Trophy } from "lucide-react";
import { formatBRL } from "@timeup/core";
import { requireAdmin } from "@/lib/session";
import { getAdminDashboard } from "@/lib/data/admin-dashboard";
import { listEmpresas } from "@/lib/data/empresa";
import { parsePeriod, parseEmpresa } from "@/lib/period";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ColaboradorTierCard, TierChips } from "@/components/dashboard/colaborador-tier-card";
import { ResumoLoja } from "@/components/dashboard/resumo-loja";
import { MonthSelector } from "@/components/month-selector";
import { EmpresaSelector } from "@/components/empresa-selector";
import {
  DashboardSyncProvider,
  SyncVendasButton,
  SyncGate,
  DashboardMainSkeleton,
  DashboardAsideSkeleton,
} from "./dashboard-sync";

function StatChip({ icon: Icon, tone, label, value }: { icon: typeof Target; tone: "brand" | "pink" | "info"; label: string; value: string }) {
  const tones = {
    brand: "bg-brand/12 text-brand",
    pink: "bg-pink/12 text-pink",
    info: "bg-info/15 text-info",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-base font-extrabold tabnums">{value}</p>
      </div>
      <MoreHorizontal className="ml-auto size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ ano?: string; mes?: string; empresa?: string }> }) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const { year, month } = parsePeriod(sp);
  const empresaId = parseEmpresa(sp);
  const [empresas, d] = await Promise.all([
    listEmpresas(user.tenantId),
    getAdminDashboard(user.tenantId, empresaId, year, month),
  ]);
  const top3 = d.colaboradores.slice(0, 3);
  const ranking = d.colaboradores.slice(0, 5);
  const topList = d.colaboradores.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {empresas.length > 1 && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <EmpresaSelector empresas={empresas} selected={empresaId} />
          <MonthSelector year={year} month={month} />
        </div>
      )}
      <DashboardSyncProvider>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      {/* ---------- main column ---------- */}
      <div className="flex min-w-0 flex-col gap-6">
        {/* hero */}
        <section className="relative overflow-hidden rounded-3xl bg-hero p-8 text-white">
          <svg className="pointer-events-none absolute -right-4 top-2 h-56 w-56 text-white/15" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L57 43 L100 50 L57 57 L50 100 L43 57 L0 50 L43 43 Z" />
          </svg>
          <svg className="pointer-events-none absolute right-40 top-24 h-24 w-24 text-white/10" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L57 43 L100 50 L57 57 L50 100 L43 43 Z" />
          </svg>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Período • {d.periodLabel}</p>
          <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight sm:text-[2.1rem]">
            Acompanhe as metas da sua loja em tempo real
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/app/metas"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
            >
              Ver metas
              <span className="grid size-5 place-items-center rounded-full bg-background/20">
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
            <SyncVendasButton
              label="Sincronizar vendas"
              className="rounded-full bg-white/15 px-5 py-2.5 font-bold text-white backdrop-blur hover:bg-white/25"
            />
          </div>
        </section>

        <SyncGate skeleton={<DashboardMainSkeleton />}>
        {/* stat chips */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatChip icon={TrendingUp} tone="brand" label="Faturamento do mês" value={formatBRL(d.store.realized)} />
          <StatChip icon={Target} tone="pink" label="Meta da loja" value={d.store.target > 0 ? formatBRL(d.store.target) : "—"} />
          <StatChip icon={Receipt} tone="info" label="Ticket médio" value={formatBRL(d.store.ticketMedio)} />
        </div>

        {/* highlights — one progress bar per meta, colored by tier */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Colaboradores em destaque</h2>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground">
                <ChevronLeft className="size-4" />
              </span>
              <span className="grid size-8 place-items-center rounded-full bg-brand text-brand-foreground">
                <ChevronRight className="size-4" />
              </span>
            </div>
          </div>
          {top3.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {top3.map((row) => (
                <ColaboradorTierCard key={row.id} row={row} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
              Nenhum colaborador ativo ainda.
            </p>
          )}
        </section>

        {/* ranking table */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Ranking do mês</h2>
            <Link href="/app/ranking" className="text-sm font-semibold text-brand hover:underline">
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-[1.4fr_1.6fr_auto] gap-3 border-b border-border pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Colaborador</span>
            <span>Progresso por meta</span>
            <span className="justify-self-end">Realizado</span>
          </div>
          {ranking.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados de vendas neste mês.</p>
          ) : (
            ranking.map((row) => (
              <div key={row.id} className="grid grid-cols-[1.4fr_1.6fr_auto] items-center gap-3 border-t border-border py-3 first:border-t-0">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-secondary text-xs">{initials(row.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.rank ? `${row.rank}º lugar` : "—"}</p>
                  </div>
                </div>
                <TierChips tiers={row.tiers} />
                <span className="justify-self-end text-sm font-bold tabnums">{formatBRL(row.realized)}</span>
              </div>
            ))
          )}
        </section>
        </SyncGate>
      </div>

      {/* ---------- right column ---------- */}
      <aside className="flex flex-col gap-6">
        <SyncGate skeleton={<DashboardAsideSkeleton />}>
        <ResumoLoja store={d.store} tierStats={d.tierStats} periodLabel={d.periodLabel} />

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Top colaboradores</h2>
            <span className="grid size-7 place-items-center rounded-full bg-secondary text-muted-foreground">
              <Plus className="size-4" />
            </span>
          </div>
          {topList.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sem colaboradores.</p>
          ) : (
            <div className="flex flex-col">
              {topList.map((row, i) => (
                <div key={row.id} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-secondary text-xs">{initials(row.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{i === 0 ? "Líder do mês" : row.rank ? `${row.rank}º lugar` : "—"}</p>
                  </div>
                  {row.topReachedName ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-bold text-success">
                      <Trophy className="size-3" />
                      {row.topReachedName}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold tabnums text-muted-foreground">{formatBRL(row.realized)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link
            href="/app/ranking"
            className="mt-3 flex items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/70"
          >
            Ver todos
          </Link>
        </section>
        </SyncGate>
      </aside>
      </div>
      </DashboardSyncProvider>
    </div>
  );
}
