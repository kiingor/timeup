import { formatPct, clampPct } from "@timeup/core";
import { requireColaborador } from "@/lib/session";
import { getColaboradorHistory } from "@/lib/data/colaborador";
import { periodLabel } from "@/lib/period";
import { PageHeader } from "@/components/page-header";

export default async function ColaboradorHistoricoPage() {
  const user = await requireColaborador();
  const rows = await getColaboradorHistory(user.tenantId, user.colaboradorId, 6);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Histórico" description="Sua evolução nos últimos meses (em percentual)." />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        {rows.map((r) => (
          <div key={`${r.year}-${r.month}`} className="flex items-center gap-4 border-t border-border py-3 first:border-t-0">
            <span className="w-32 shrink-0 text-sm font-semibold">{periodLabel(r.year, r.month)}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-brand" style={{ width: `${clampPct(r.pct) * 100}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right text-sm font-bold tabnums text-brand">{formatPct(r.pct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
