import { Trophy, Store } from "lucide-react";
import { formatBRL } from "@timeup/core";
import { requireAdmin } from "@/lib/session";
import { getAdminRanking } from "@/lib/data/admin-ranking";
import { listEmpresas } from "@/lib/data/empresa";
import { parsePeriod, parseEmpresa, periodLabel } from "@/lib/period";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MonthSelector } from "@/components/month-selector";
import { EmpresaSelector } from "@/components/empresa-selector";
import { TierChips } from "@/components/dashboard/colaborador-tier-card";
import { ReleaseRankingToggle } from "./ranking-client";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_ORDER = [1, 0, 2]; // visually center the winner

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ ano?: string; mes?: string; empresa?: string }> }) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const { year, month } = parsePeriod(sp);
  const empresaId = parseEmpresa(sp);
  const [empresas, { released, storeRealized, rows }] = await Promise.all([
    listEmpresas(user.tenantId),
    getAdminRanking(user.tenantId, year, month, empresaId),
  ]);

  const ranked = rows.filter((r) => r.realized > 0);
  const podium = ranked.slice(0, 3);

  return (
    <div>
      <PageHeader title="Ranking" description={`Classificação de ${periodLabel(year, month)}.`}>
        <EmpresaSelector empresas={empresas} selected={empresaId} />
        <MonthSelector year={year} month={month} />
      </PageHeader>

      <div className="mb-6">
        <ReleaseRankingToggle year={year} month={month} released={released} empresaId={empresaId} />
      </div>

      {ranked.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card py-24 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Trophy className="size-7" />
          </span>
          <p className="mt-4 font-semibold">Sem vendas neste mês</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Assim que houver vendas sincronizadas, o ranking aparece aqui.
          </p>
        </div>
      ) : (
        <>
          {/* podium */}
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PODIUM_ORDER.map((idx) => {
              const row = podium[idx];
              if (!row) return <div key={idx} className="hidden sm:block" />;
              const place = idx + 1;
              const elevated = place === 1;
              return (
                <div
                  key={row.id}
                  className={`flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-soft ${
                    elevated ? "sm:-mt-2 sm:ring-2 sm:ring-brand/30" : ""
                  }`}
                >
                  <span className="text-3xl leading-none">{MEDALS[idx]}</span>
                  <Avatar className={`mt-3 ${elevated ? "size-16" : "size-14"} ring-4 ring-card`}>
                    <AvatarFallback className="bg-brand font-bold text-brand-foreground">{initials(row.name)}</AvatarFallback>
                  </Avatar>
                  <p className="mt-3 truncate font-bold">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{place}º lugar</p>
                  <p className="mt-2 text-lg font-extrabold tabnums">{formatBRL(row.realized)}</p>
                  {row.topReachedName ? (
                    <Badge variant="success" className="mt-2">Atingiu {row.topReachedName}</Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-2">Em progresso</Badge>
                  )}
                </div>
              );
            })}
          </section>

          {/* full table */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Classificação completa</h2>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Store className="size-4" />
                Loja: <span className="font-semibold tabnums text-foreground">{formatBRL(storeRealized)}</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[auto_1.4fr_1.6fr_auto] items-center gap-3 border-b border-border pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>#</span>
                  <span>Colaborador</span>
                  <span>Progresso por meta</span>
                  <span className="justify-self-end">Realizado</span>
                </div>
                {ranked.map((row, i) => (
                  <div key={row.id} className="grid grid-cols-[auto_1.4fr_1.6fr_auto] items-center gap-3 border-t border-border py-3 first:border-t-0">
                    <span className="w-7 text-center text-sm font-extrabold tabnums text-muted-foreground">
                      {i < 3 ? MEDALS[i] : i + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-secondary text-xs">{initials(row.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{row.name}</p>
                        {!row.linked && <p className="text-xs text-muted-foreground">Sem vínculo Softcom</p>}
                      </div>
                    </div>
                    <TierChips tiers={row.tiers} />
                    <span className="justify-self-end text-sm font-bold tabnums">{formatBRL(row.realized)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
