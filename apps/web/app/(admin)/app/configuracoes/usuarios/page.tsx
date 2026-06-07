import { KeyRound, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listTenantUsers } from "@/lib/data/users";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NovoUsuarioDialog } from "./novo-usuario-dialog";

const dt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function UsuariosPage() {
  const user = await requireAdmin();
  const users = await listTenantUsers(user.tenantId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Usuários" description="Quem tem acesso a esta empresa.">
        <NovoUsuarioDialog />
      </PageHeader>

      <div className="rounded-2xl border border-border bg-card p-2 shadow-soft sm:p-4">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl px-3 py-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-secondary text-xs">{initials(u.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{u.name}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            {u.role === "admin" ? (
              <Badge>
                <ShieldCheck className="mr-1 size-3" />
                Admin
              </Badge>
            ) : (
              <Badge variant="secondary">
                <KeyRound className="mr-1 size-3" />
                Colaborador
              </Badge>
            )}
            <span className="hidden w-32 text-right text-xs text-muted-foreground sm:block">
              {u.lastLoginAt ? `Acesso ${dt.format(u.lastLoginAt)}` : "Nunca acessou"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
