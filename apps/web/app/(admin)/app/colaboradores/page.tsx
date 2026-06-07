import Link from "next/link";
import { Plug, KeyRound, ArrowUpRight, Users } from "lucide-react";
import { formatBRL } from "@timeup/core";
import { requireAdmin } from "@/lib/session";
import { listColaboradores } from "@/lib/data/metas";
import { listEmpresas } from "@/lib/data/empresa";
import { currentPeriod, parseEmpresa } from "@/lib/period";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmpresaSelector } from "@/components/empresa-selector";
import { NovoColaboradorDialog } from "./novo-colaborador-dialog";

export default async function ColaboradoresPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const user = await requireAdmin();
  const { year, month } = currentPeriod();
  const empresaId = parseEmpresa(await searchParams);
  const [empresas, rows] = await Promise.all([
    listEmpresas(user.tenantId),
    listColaboradores(user.tenantId, year, month, empresaId),
  ]);
  const multiEmpresa = empresas.length > 1;

  return (
    <div>
      <PageHeader title="Colaboradores" description="Gerencie a equipe e o vínculo com o Softcom.">
        <EmpresaSelector empresas={empresas} selected={empresaId} />
        <NovoColaboradorDialog empresas={empresas} />
      </PageHeader>

      {rows.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card py-24 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Users className="size-7" />
          </span>
          <p className="mt-4 font-semibold">Nenhum colaborador ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre o primeiro colaborador da equipe.</p>
          <div className="mt-4">
            <NovoColaboradorDialog empresas={empresas} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-2 shadow-soft sm:p-4">
          <div className="hidden grid-cols-[1.8fr_1fr_1fr_auto] gap-3 border-b border-border px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
            <span>Colaborador</span>
            <span>Integração</span>
            <span>Realizado no mês</span>
            <span />
          </div>
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/app/colaboradores/${c.id}`}
              className="grid grid-cols-1 items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/60 sm:grid-cols-[1.8fr_1fr_1fr_auto]"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-secondary text-xs">{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    {!c.active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {multiEmpresa ? c.empresaName : (c.email ?? "Sem e-mail")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {c.linked ? (
                  <Badge variant="success">
                    <Plug className="mr-1 size-3" />
                    Vendedor #{c.softcomVendedorId}
                  </Badge>
                ) : (
                  <Badge variant="warning">Não vinculado</Badge>
                )}
                {c.hasLogin && (
                  <Badge variant="secondary">
                    <KeyRound className="mr-1 size-3" />
                    Login
                  </Badge>
                )}
              </div>
              <span className="text-sm font-semibold tabnums">{formatBRL(c.realized)}</span>
              <ArrowUpRight className="hidden size-4 justify-self-end text-muted-foreground sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
