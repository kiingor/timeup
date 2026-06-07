import { Bell, Users, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getTenantDb } from "@timeup/db";
import { requireAdmin } from "@/lib/session";
import { listAdminNotifications } from "@/lib/data/notifications";
import { PageHeader } from "@/components/page-header";
import { NovaNotificacaoDialog } from "./nova-notificacao-dialog";

export default async function NotificacoesPage() {
  const user = await requireAdmin();
  const db = getTenantDb(user.tenantId);
  const [sent, colaboradores] = await Promise.all([
    listAdminNotifications(user.tenantId),
    db.colaborador.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notificações" description="Envie avisos para a equipe — eles aparecem no portal do colaborador.">
        <NovaNotificacaoDialog colaboradores={colaboradores} />
      </PageHeader>

      {sent.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card py-24 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Bell className="size-7" />
          </span>
          <p className="mt-4 font-semibold">Nenhuma notificação enviada</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie a primeira para avisar a equipe.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-2 shadow-soft sm:p-4">
          {sent.map((n) => {
            const broadcast = n.targetName.startsWith("Todos");
            return (
              <div key={n.id} className="flex gap-3 border-t border-border px-3 py-3.5 first:border-t-0">
                <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${broadcast ? "bg-brand/12 text-brand" : "bg-info/15 text-info"}`}>
                  {broadcast ? <Users className="size-4" /> : <User className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1.5 text-xs font-medium text-muted-foreground">Para: {n.targetName}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
