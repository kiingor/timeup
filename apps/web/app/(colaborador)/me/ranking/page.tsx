import { Lock, Flag } from "lucide-react";
import { requireColaborador } from "@/lib/session";
import { getColaboradorRanking } from "@/lib/data/colaborador";
import { currentPeriod, periodLabel } from "@/lib/period";
import { PageHeader } from "@/components/page-header";
import { Race3DLoader } from "@/components/vehicles/race-3d-loader";

export default async function ColaboradorRankingPage() {
  const user = await requireColaborador();
  const { year, month } = currentPeriod();
  const { released, entries } = await getColaboradorRanking(user.tenantId, user.colaboradorId, year, month);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="A corrida do mês" description={`Quem está na frente em ${periodLabel(year, month)}.`} />

      {!released ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card py-24 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Lock className="size-7" />
          </span>
          <p className="mt-4 font-semibold">Ranking não liberado</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">A gestão ainda não liberou o ranking deste mês.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card py-24 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Flag className="size-7" />
          </span>
          <p className="mt-4 font-semibold">A corrida ainda não começou</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Assim que houver vendas no mês, os carros entram na pista.</p>
        </div>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Flag className="size-4 text-brand" />
              Pista
            </h2>
            <span className="text-xs text-muted-foreground">Escolha seu veículo em Meu perfil</span>
          </div>
          <Race3DLoader entries={entries} />
        </section>
      )}
    </div>
  );
}
