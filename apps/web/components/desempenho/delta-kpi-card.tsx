import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatBRL, formatPct } from "@timeup/core";
import type { DeltaKpi } from "@/lib/data/desempenho";

/**
 * One KPI with its change vs the previous month. Green up / red down — EXCEPT the
 * in-progress current month (`partial`), where a steep mid-month dip is expected, not
 * a regression: we show a neutral "parcial" chip instead of an alarming red arrow.
 */
export function DeltaKpiCard({
  icon: Icon,
  tone,
  label,
  kind,
  delta,
  partial,
}: {
  icon: typeof ArrowUpRight;
  tone: "brand" | "info" | "pink";
  label: string;
  kind: "money" | "count";
  delta: DeltaKpi;
  partial: boolean;
}) {
  const tones = { brand: "bg-brand/12 text-brand", info: "bg-info/15 text-info", pink: "bg-pink/12 text-pink" } as const;
  const fmt = (n: number) => (kind === "money" ? formatBRL(n) : n.toLocaleString("pt-BR"));

  const up = delta.pct > 0;
  const neutral = partial || delta.pct === 0;
  const chip = neutral
    ? "bg-secondary text-muted-foreground"
    : up
      ? "bg-success/12 text-success"
      : "bg-destructive/12 text-destructive";
  const ArrowIcon = neutral ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold tabnums ${chip}`}>
          <ArrowIcon className="size-3" strokeWidth={2.5} />
          {partial ? "parcial" : `${up ? "+" : ""}${formatPct(delta.pct)}`}
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tabnums leading-none">{fmt(delta.current)}</p>
      <p className="mt-2 text-xs font-medium text-foreground/70">{label}</p>
      <p className="text-xs text-muted-foreground">
        {partial ? "Mês em andamento · " : "Mês anterior: "}
        <span className="tabnums">{fmt(delta.prev)}</span>
        {partial ? " (mês anterior)" : ""}
      </p>
    </div>
  );
}
