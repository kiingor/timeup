import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plug, KeyRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getColaborador, getActiveMetaTiers, getColaboradorGoals } from "@/lib/data/metas";
import { listEmpresas } from "@/lib/data/empresa";
import { parsePeriod, periodLabel } from "@/lib/period";
import { initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MonthSelector } from "@/components/month-selector";
import { GoalsEditor } from "@/components/forms/goals-editor";
import { ColaboradorForm } from "@/components/forms/colaborador-form";
import { DeleteColaboradorButton } from "./delete-colaborador-button";

export default async function ColaboradorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const { year, month } = parsePeriod(await searchParams);

  const colaborador = await getColaborador(user.tenantId, id);
  if (!colaborador) notFound();

  const [tiers, goalsMap, empresas] = await Promise.all([
    getActiveMetaTiers(user.tenantId),
    getColaboradorGoals(user.tenantId, id, year, month),
    listEmpresas(user.tenantId),
  ]);
  const initialGoals = Object.fromEntries(goalsMap);
  const hasLogin = Boolean(colaborador.user);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/colaboradores" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Colaboradores
      </Link>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <Avatar className="size-14">
          <AvatarFallback className="bg-brand/15 text-lg text-brand">{initials(colaborador.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-extrabold">{colaborador.name}</h1>
            {!colaborador.active && <Badge variant="secondary">Inativo</Badge>}
          </div>
          <p className="truncate text-sm text-muted-foreground">{colaborador.email ?? "Sem e-mail"}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {colaborador.softcomVendedorId ? (
            <Badge variant="success">
              <Plug className="mr-1 size-3" />
              Vendedor #{colaborador.softcomVendedorId}
            </Badge>
          ) : (
            <Badge variant="warning">Não vinculado</Badge>
          )}
          {hasLogin && (
            <Badge variant="secondary">
              <KeyRound className="mr-1 size-3" />
              Tem login
            </Badge>
          )}
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Metas de {periodLabel(year, month)}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Defina o valor de cada nível para o mês.</p>
          </div>
          <MonthSelector year={year} month={month} />
        </div>
        <GoalsEditor
          colaboradorId={colaborador.id}
          year={year}
          month={month}
          tiers={tiers.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
          initial={initialGoals}
        />
      </section>

      <ColaboradorForm
        mode="edit"
        id={colaborador.id}
        hasLogin={hasLogin}
        empresas={empresas}
        initial={{
          empresaId: colaborador.empresaId,
          name: colaborador.name,
          email: colaborador.email ?? "",
          softcomVendedorId: colaborador.softcomVendedorId ?? "",
          softcomVendedorNome: colaborador.softcomVendedorNome ?? "",
          active: colaborador.active,
        }}
      />

      {/* danger zone */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <div>
          <h2 className="font-bold text-destructive">Excluir colaborador</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Remove o colaborador, metas, histórico de vendas e login. Não pode ser desfeito.</p>
        </div>
        <DeleteColaboradorButton id={colaborador.id} name={colaborador.name} />
      </section>
    </div>
  );
}
