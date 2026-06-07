"use client";

import { signOut } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import type { Role } from "@timeup/core";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "./mobile-nav";
import { NotificationsBell } from "./notifications-bell";
import type { NotificationItem } from "@/lib/data/notifications";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Topbar({
  user,
  role,
  brandName,
  logoUrl,
  notifications,
}: {
  user: { name: string; email: string };
  role: Role;
  brandName: string;
  logoUrl: string | null;
  notifications?: { items: NotificationItem[]; unread: number };
}) {
  return (
    <header className="flex items-center gap-3 px-4 pt-5 sm:gap-4 sm:px-6 sm:pt-6">
      <MobileNav role={role} brandName={brandName} logoUrl={logoUrl} />

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <NotificationsBell role={role} items={notifications?.items} unread={notifications?.unread} />

        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 outline-none transition-colors hover:bg-secondary">
            <Avatar className="size-9">
              <AvatarFallback className="bg-brand/15 text-brand">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-semibold sm:block">{user.name}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[15rem]">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{user.name}</span>
              <span className="font-normal">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })} className="text-destructive focus:bg-destructive/10">
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
