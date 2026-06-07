"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import type { Role } from "@timeup/core";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/data/notifications";

const BELL_BTN =
  "relative grid size-11 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary";

export function NotificationsBell({
  role,
  items = [],
  unread = 0,
}: {
  role: Role;
  items?: NotificationItem[];
  unread?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (role === "master") return null;

  // admin: the bell links to the management page
  if (role === "admin") {
    return (
      <Link href="/app/notificacoes" aria-label="Notificações" className={BELL_BTN}>
        <Bell className="size-[18px]" />
      </Link>
    );
  }

  async function open(item: NotificationItem) {
    if (item.read) return;
    await markNotificationRead(item.id);
    router.refresh();
  }
  async function readAll() {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Notificações" className={BELL_BTN}>
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground ring-2 ring-card">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <p className="text-sm font-bold">Notificações</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={readAll}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto border-t border-border">
          {items.length === 0 ? (
            <div className="grid place-items-center gap-2 px-3 py-10 text-center text-muted-foreground">
              <BellOff className="size-6" />
              <p className="text-sm">Nenhuma notificação ainda.</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => open(n)}
                className={`flex w-full gap-2.5 border-b border-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary/60 ${
                  n.read ? "" : "bg-brand/[0.06]"
                }`}
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
