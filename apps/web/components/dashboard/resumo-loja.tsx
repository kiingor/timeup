import { Store, Receipt, ShoppingBag, Target } from "lucide-react";
import { formatBRL, formatPct } from "@timeup/core";
import { ProgressRing } from "@/components/charts/progress-ring";
import type { StoreSummary, TierStat } from "@/lib/data/admin-dashboard";

function KpiTile({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Receipt;
  tone: "info" | "pink";
  label: string;
  value: string;
}) {
  const tones = { info: "bg-info/15 text-info", pink: "bg-pink/12 text-pink" } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <span className={`grid size-8 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="size-4" />
      </span>
      <p className="mt-2 text-base font-extrabold tabnums">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Right-panel STORE summary — unambiguously about the loja (store glyph + title),
 * NOT the logged-in admin. Faturamento vs meta, store KPIs, and a per-tier tally of
 * how many colaboradores reached each level. RSC, no client hooks.
 */
export function ResumoLoja({
  store,
  tierStats,
  periodLabel,
}: {
  store: StoreSummary;
  tierStats: TierStat[];
  periodLabel: string;
}) {
  const hasGoal = store.target > 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      {/* unambiguous store identity — no admin avatar */}
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
          <Store className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight">Resumo da loja</h2>
          <p className="text-xs text-muted-foreground">Desempenho • {periodLabel}</p>
        </div>
      </div>

      {/* faturamento vs meta */}
      <div className="mt-5 flex items-center gap-4">
        <ProgressRing value={hasGoal ? store.pct : 0} size={104} stroke={9}>
          <div className="text-center leading-none">
            {hasGoal ? (
              <>
                <p className="text-lg font-extrabold tabnums">{formatPct(store.pct)}</p>
                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">da meta</p>
              </>
            ) : (
              <Target className="size-6 text-muted-foreground" />
            )}
          </div>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Faturamento</p>
          <p className="text-2xl font-extrabold tabnums leading-tight">{formatBRL(store.realized)}</p>
          {hasGoal ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Meta: <span className="font-semibold text-foreground tabnums">{formatBRL(store.target)}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs font-medium text-brand">Defina a meta da loja em Metas</p>
          )}
        </div>
      </div>

      {/* store KPI tiles */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <KpiTile icon={Receipt} tone="info" label="Ticket médio" value={formatBRL(store.ticketMedio)} />
        <KpiTile icon={ShoppingBag} tone="pink" label="Vendas no mês" value={store.salesCount.toLocaleString("pt-BR")} />
      </div>

      {/* per-tier attainment: how many colaboradores reached each level */}
      {tierStats.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Colaboradores por meta
          </p>
          <p className="mb-3 mt-0.5 text-xs text-muted-foreground">Quantos já atingiram cada nível neste período.</p>
          <div className="flex flex-col gap-3">
            {tierStats.map((t) => {
              const ratio = t.totalWithGoal > 0 ? t.reachedCount / t.totalWithGoal : 0;
              return (
                <div key={t.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </span>
                    <span className="tabnums font-bold" style={{ color: t.color }}>
                      {t.reachedCount}
                      <span className="text-muted-foreground">/{t.totalWithGoal}</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${ratio * 100}%`, backgroundColor: t.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
