import Link from "next/link";
import { Layers, Palette, Users, Plug, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";

const ITEMS = [
  { href: "/app/configuracoes/metas", icon: Layers, title: "Níveis de meta", desc: "Normal, Média, Agressiva e outros níveis." },
  { href: "/app/integracao", icon: Plug, title: "Integração Softcom", desc: "Conexão e sincronização das vendas." },
  { href: "/app/configuracoes/aparencia", icon: Palette, title: "Aparência", desc: "Cores e identidade visual da empresa." },
  { href: "/app/configuracoes/usuarios", icon: Users, title: "Usuários", desc: "Administradores e acessos." },
];

export default async function ConfiguracoesPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Configurações" description="Ajustes da sua empresa." />
      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:bg-secondary/50"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-brand/12 text-brand">
              <it.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{it.title}</p>
              <p className="truncate text-sm text-muted-foreground">{it.desc}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
