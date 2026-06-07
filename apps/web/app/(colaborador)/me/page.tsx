import Link from "next/link";
import { Trophy, ArrowUpRight, CheckCircle2, Flame, Gift } from "lucide-react";
import { formatPct, formatBRL } from "@timeup/core";
import { requireColaborador } from "@/lib/session";
import { getColaboradorDashboard } from "@/lib/data/colaborador";
import { currentPeriod, periodLabel } from "@/lib/period";
import { ProgressRing } from "@/components/charts/progress-ring";
import { PercentArea } from "@/components/charts/percent-area";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function ColaboradorHome() {
  const user = await requireColaborador();
  const { year, month } = currentPeriod();
  const d = await getColaboradorDashboard(user.tenantId, user.colaboradorId, year, month);

  const firstName = (d.colaboradorName || user.name).split(" ")[0];
  const refIndex = Math.min(1, d.tiers.length - 1);
  const reference = d.tiers[refIndex];
  const reachedCount = d.tiers.filter((t) => t.reached).length;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        {/* greeting hero */}
        <section className="relative overflow-hidden rounded-3xl bg-hero p-8 text-white">
          <svg className="pointer-events-none absolute -right-6 top-2 h-48 w-48 text-white/15" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L57 43 L100 50 L57 57 L50 100 L43 57 L0 50 L43 43 Z" />
          </svg>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{periodLabel(year, month)}</p>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-extrabold">
            {greeting()}, {firstName} <Flame className="size-7" />
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/80">
            Continue acompanhando sua evolução para atingir cada nível da sua meta.
          </p>
        </section>

        {/* tier rings */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {d.tiers.map((t) => (
            <div key={t.tierId} className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
              <ProgressRing value={t.pctOfTier} size={120} trackClassName="stroke-secondary">
                <div className="text-center">
                  <p className="text-xl font-extrabold tabnums">{formatPct(t.pctOfTier)}</p>
                </div>
              </ProgressRing>
              <p className="mt-3 flex items-center gap-1.5 font-bold">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: t.color ?? "var(--brand)" }} />
                {t.tierName}
              </p>
              {t.reached ? (
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-success">
                  <CheckCircle2 className="size-4" /> Meta atingida!
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">faltam {formatPct(t.pctRemaining)}</p>
              )}

              {/* prize: the R$ amount shows ONLY once reached; otherwise just a teaser */}
              {t.bonusBrl != null ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1 text-sm font-extrabold text-success">
                  <Gift className="size-4" /> Bônus de {formatBRL(t.bonusBrl)} 🎉
                </p>
              ) : t.hasBonus ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Gift className="size-3.5" /> Tem prêmio nesta meta
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* evolution */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-bold">Sua evolução diária</h2>
            {reference && (
              <span className="text-xs text-muted-foreground">% rumo à meta {reference.tierName}</span>
            )}
          </div>
          {d.evolution.length > 0 ? (
            <PercentArea data={d.evolution} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Ainda não há vendas registradas neste mês.</p>
          )}
        </section>
      </div>

      {/* aside */}
      <aside className="flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
          <h2 className="text-left text-lg font-bold">Resumo</h2>
          <div className="mt-3 flex flex-col items-center">
            <ProgressRing value={reference?.pctOfTier ?? 0} size={150}>
              <div className="text-center">
                <p className="text-2xl font-extrabold tabnums">{formatPct(reference?.pctOfTier ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{reference?.tierName ?? "Meta"}</p>
              </div>
            </ProgressRing>
            <p className="mt-4 text-sm text-muted-foreground">
              Você atingiu <span className="font-bold text-foreground">{reachedCount}</span> de {d.tiers.length} níveis neste mês.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">Ranking</h2>
            <Trophy className="size-4 text-muted-foreground" />
          </div>
          {d.rankReleased ? (
            <div>
              <p className="text-sm text-muted-foreground">Sua posição neste mês</p>
              <p className="mt-1 text-3xl font-extrabold tabnums text-brand">{d.rankPosition ? `${d.rankPosition}º` : "—"}</p>
              <Link
                href="/me/ranking"
                className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/70"
              >
                Ver ranking completo <ArrowUpRight className="size-4" />
              </Link>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">O ranking deste mês ainda não foi liberado pela gestão.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
