"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sparkles, LogOut } from "lucide-react";
import type { Role } from "@timeup/core";
import { cn } from "@/lib/utils";
import { getNav, type NavItem } from "./nav";

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function Sidebar({ role, brandName, logoUrl }: { role: Role; brandName: string; logoUrl?: string | null }) {
  const pathname = usePathname();
  const groups = getNav(role);

  return (
    <aside className="flex h-full flex-col bg-sidebar px-4 py-6">
      <Link href="#" className="mb-2 flex items-center gap-2.5 px-2">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={brandName} className="size-9 rounded-xl object-contain" />
        ) : (
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-foreground shadow-soft">
            <Sparkles className="size-5" />
          </span>
        )}
        <span className="truncate text-lg font-extrabold tracking-tight text-sidebar-foreground">{brandName}</span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.label && (
              <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {group.label}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-sidebar-active text-sidebar-active-foreground"
                          : "text-sidebar-foreground/70 hover:bg-secondary hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className={cn("size-[18px] shrink-0", active ? "text-brand" : "text-sidebar-muted")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-[18px] shrink-0" />
          Sair
        </button>
      </nav>
    </aside>
  );
}
