import { Crown, ShieldCheck, KeyRound } from "lucide-react";
import { requireMaster } from "@/lib/session";
import { listAllUsers } from "@/lib/data/users";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ROLE = {
  master: { icon: Crown, label: "Master", variant: "default" as const },
  admin: { icon: ShieldCheck, label: "Admin", variant: "secondary" as const },
  colaborador: { icon: KeyRound, label: "Colaborador", variant: "outline" as const },
};

export default async function MasterUsuariosPage() {
  await requireMaster();
  const users = await listAllUsers();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Usuários" description="Todos os usuários da plataforma." />

      <div className="rounded-2xl border border-border bg-card p-2 shadow-soft sm:p-4">
        {users.map((u) => {
          const r = ROLE[u.role];
          return (
            <div key={u.id} className="flex items-center gap-3 rounded-xl px-3 py-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-secondary text-xs">{initials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="hidden text-sm text-muted-foreground sm:block">{u.tenant?.name ?? "—"}</span>
              <Badge variant={r.variant}>
                <r.icon className="mr-1 size-3" />
                {r.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
