import { Plug, CheckCircle2, AlertTriangle, Building2, History, Plus } from "lucide-react";
import { getTenantDb } from "@timeup/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProvisionDialog, SyncEmpresaButton } from "./integracao-client";
import { RemoveEmpresaButton } from "./remove-empresa-button";

const DEVICE_HINT = "Cole a URL de device/add para gerar as credenciais e vincular a empresa. Cada dispositivo conecta UMA empresa.";

const dt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const STATUS_BADGE = {
  success: { variant: "success" as const, label: "Sucesso" },
  error: { variant: "destructive" as const, label: "Erro" },
  partial: { variant: "warning" as const, label: "Parcial" },
  running: { variant: "secondary" as const, label: "Em execução" },
};

export default async function IntegracaoPage() {
  const user = await requireAdmin();
  const db = getTenantDb(user.tenantId);
  const [empresas, colabs, runs] = await Promise.all([
    db.empresa.findMany({ include: { connection: true }, orderBy: { name: "asc" } }),
    db.colaborador.findMany({ where: { active: true }, select: { empresaId: true, softcomVendedorId: true } }),
    db.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
  ]);

  // per-empresa colaborador / linked tallies
  const totalByEmpresa = new Map<string, number>();
  const linkedByEmpresa = new Map<string, number>();
  for (const c of colabs) {
    totalByEmpresa.set(c.empresaId, (totalByEmpresa.get(c.empresaId) ?? 0) + 1);
    if (c.softcomVendedorId) linkedByEmpresa.set(c.empresaId, (linkedByEmpresa.get(c.empresaId) ?? 0) + 1);
  }
  const empresaName = new Map(empresas.map((e) => [e.id, e.name]));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Integração Softcom" description="Conecte uma empresa por dispositivo e sincronize as vendas.">
        <ProvisionDialog
          title="Adicionar empresa"
          description={DEVICE_HINT}
          trigger={
            <Button>
              <Plus className="size-4" />
              Adicionar empresa
            </Button>
          }
        />
      </PageHeader>

      {empresas.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-warning/15 text-warning">
              <Plug className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="font-bold">Conecte ao Softcom</h2>
              <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                Cole a URL de <code className="rounded bg-secondary px-1">device/add</code> de cada empresa. Cada
                dispositivo traz os dados de uma empresa.
              </p>
              <ProvisionDialog
                title="Conectar ao Softcom"
                description={DEVICE_HINT}
                trigger={
                  <Button>
                    <Plug className="size-4" />
                    Conectar ao Softcom
                  </Button>
                }
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {empresas.map((e) => {
            const enabled = Boolean(e.connection?.enabled);
            const total = totalByEmpresa.get(e.id) ?? 0;
            const linked = linkedByEmpresa.get(e.id) ?? 0;
            return (
              <section key={e.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`grid size-11 place-items-center rounded-xl ${enabled ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {enabled ? <CheckCircle2 className="size-5" /> : <Plug className="size-5" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold">{e.name}</h2>
                        {enabled ? <Badge variant="success">Ativo</Badge> : <Badge variant="warning">Pendente</Badge>}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="size-4" />
                        empresa #{e.softcomEmpresaId}
                        {e.cnpj ? ` • ${e.cnpj}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {e.connection?.instance && <p>Instância: {e.connection.instance}</p>}
                    {e.connection?.deviceName && <p>Device: {e.connection.deviceName}</p>}
                    {e.connection?.provisionedAt && <p>Desde {dt.format(e.connection.provisionedAt)}</p>}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {linked} de {total} colaboradores vinculados
                    {linked < total && (
                      <Badge variant="warning">
                        <AlertTriangle className="mr-1 size-3" />
                        {total - linked} sem vínculo
                      </Badge>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {enabled && <SyncEmpresaButton empresaId={e.id} />}
                    <ProvisionDialog
                      title={`Renovar credenciais — ${e.name}`}
                      description="Cole uma nova URL de device/add desta empresa para renovar as credenciais."
                      trigger={
                        <Button size="sm" variant="ghost">
                          Renovar credenciais
                        </Button>
                      }
                    />
                    <RemoveEmpresaButton id={e.id} name={e.name} colaboradorCount={total} />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* history */}
      {runs.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <History className="size-4 text-muted-foreground" />
            Sincronizações
          </h2>
          {runs.map((r) => {
            const s = STATUS_BADGE[r.status];
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 border-t border-border py-3 text-sm first:border-t-0">
                <span className="text-muted-foreground">{dt.format(r.startedAt)}</span>
                <span className="flex-1 truncate text-muted-foreground">
                  {r.empresaId ? `${empresaName.get(r.empresaId) ?? "—"} · ` : ""}
                  {r.status === "success" ? `${r.rowsUpserted} atualizado(s)` : (r.error ?? "—")}
                </span>
                <Badge variant={s.variant}>{s.label}</Badge>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
