import {
  LayoutDashboard,
  Target,
  Users,
  Trophy,
  BarChart3,
  Settings,
  Building2,
  UserCog,
  LineChart,
  History,
  UserRound,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@timeup/core";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** root items match only on exact path. */
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

const ADMIN: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Dashboard", href: "/app", icon: LayoutDashboard, exact: true },
      { label: "Metas", href: "/app/metas", icon: Target },
      { label: "Colaboradores", href: "/app/colaboradores", icon: Users },
      { label: "Ranking", href: "/app/ranking", icon: Trophy },
      { label: "Desempenho", href: "/app/desempenho", icon: BarChart3 },
      { label: "Notificações", href: "/app/notificacoes", icon: Bell },
    ],
  },
  {
    label: "Configurações",
    items: [{ label: "Configurações", href: "/app/configuracoes", icon: Settings }],
  },
];

const MASTER: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Visão geral", href: "/master", icon: LayoutDashboard, exact: true },
      { label: "Empresas", href: "/master/empresas", icon: Building2 },
      { label: "Usuários", href: "/master/usuarios", icon: UserCog },
    ],
  },
  {
    label: "Configurações",
    items: [{ label: "Configurações", href: "/master/configuracoes", icon: Settings }],
  },
];

const COLABORADOR: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Meu desempenho", href: "/me", icon: LineChart, exact: true },
      { label: "Ranking", href: "/me/ranking", icon: Trophy },
      { label: "Histórico", href: "/me/historico", icon: History },
    ],
  },
  {
    label: "Conta",
    items: [{ label: "Meu perfil", href: "/me/perfil", icon: UserRound }],
  },
];

export function getNav(role: Role): NavGroup[] {
  if (role === "master") return MASTER;
  if (role === "colaborador") return COLABORADOR;
  return ADMIN;
}
