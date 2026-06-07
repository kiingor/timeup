import { Check } from "lucide-react";
import { formatBRL, formatPct, clampPct } from "@timeup/core";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ColaboradorDashRow, TierProgress } from "@/lib/data/admin-dashboard";

/** One tier = one full-width row: dot + name + colored bar + true %. */
function TierBarRow({ tier, inFocus }: { tier: TierProgress; inFocus: boolean }) {
  const fill = clampPct(tier.pct); // 0..1 for the bar width
  const width = `${Math.max(fill * 100, tier.pct > 0 ? 4 : 0)}%`; // min sliver if any progress
  const over = tier.pct > 1;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tier.color }} aria-hidden />
        <span className={`text-xs ${inFocus ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
          {tier.name}
        </span>
        <span
          className={`ml-auto inline-flex items-center gap-0.5 text-xs tabnums ${
            tier.reached ? "font-bold" : "font-semibold text-muted-foreground"
          }`}
          style={tier.reached ? { color: tier.color } : undefined}
        >
          {tier.reached && <Check className="size-3" strokeWidth={3} />}
          {formatPct(tier.pct)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width,
            backgroundColor: tier.color,
            // dark-safe over-achievement marker: a bright inset edge when >100%
            boxShadow: over ? `inset -3px 0 0 0 color-mix(in srgb, ${tier.color} 45%, white)` : undefined,
          }}
        />
      </div>
    </div>
  );
}

/** Compact horizontal tier chips for dense contexts (ranking rows, lists). */
export function TierChips({ tiers }: { tiers: TierProgress[] }) {
  if (tiers.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tiers.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabnums"
          style={{ color: t.color, backgroundColor: `color-mix(in srgb, ${t.color} 12%, transparent)` }}
          title={`${t.name}: ${formatPct(t.pct)}`}
        >
          {t.reached && <Check className="size-2.5" strokeWidth={3} />}
          {t.name} {formatPct(t.pct)}
        </span>
      ))}
    </div>
  );
}

export function ColaboradorTierCard({ row }: { row: ColaboradorDashRow }) {
  // the tier they're currently working toward = lowest unreached (tiers are low→high)
  const focusTierId = row.tiers.find((t) => !t.reached)?.id ?? null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {/* header band — keeps the existing hero/avatar language */}
      <div className="relative h-24 bg-hero">
        <div className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/20 text-xs font-bold text-white backdrop-blur tabnums">
          {row.rank ? `${row.rank}º` : "—"}
        </div>
        <div className="absolute -bottom-6 left-4">
          <Avatar className="size-12 ring-4 ring-card">
            <AvatarFallback className="bg-brand font-bold text-brand-foreground">{initials(row.name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-8">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">{row.name}</p>
            <p className="text-xs text-muted-foreground tabnums">{formatBRL(row.realized)}</p>
          </div>
          {row.topReachedName ? (
            <Badge variant="success" className="shrink-0">Atingiu {row.topReachedName}</Badge>
          ) : !row.linked ? (
            <Badge variant="secondary" className="shrink-0">Sem vínculo</Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">Em progresso</Badge>
          )}
        </div>

        {/* one stacked bar per tier, in the tier's own color */}
        {row.tiers.length > 0 ? (
          <div className="mt-0.5 space-y-2.5">
            {row.tiers.map((tier) => (
              <TierBarRow key={tier.id} tier={tier} inFocus={tier.id === focusTierId} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
            Sem metas definidas para este colaborador.
          </p>
        )}
      </div>
    </div>
  );
}
