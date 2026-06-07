"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { triggerSync } from "./integracao/actions";

const SyncCtx = createContext<{ busy: boolean; sync: () => void }>({ busy: false, sync: () => {} });

/**
 * Provides a "syncing" state to the dashboard: the button triggers triggerSync(), toasts
 * the result, then refreshes the route. `busy` stays true through the server action AND
 * the subsequent route re-render, so skeletons show until fresh data arrives.
 */
export function DashboardSyncProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = running || isPending;

  function sync() {
    if (busy) return;
    setRunning(true);
    (async () => {
      try {
        const res = await triggerSync();
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(`Sincronizado — ${res.rows} vendedor(es) atualizado(s).`);
        startTransition(() => router.refresh());
      } finally {
        setRunning(false);
      }
    })();
  }

  return <SyncCtx.Provider value={{ busy, sync }}>{children}</SyncCtx.Provider>;
}

/** Hero "Sincronizar vendas" button wired to the provider. */
export function SyncVendasButton({ className, label = "Sincronizar vendas" }: { className?: string; label?: string }) {
  const { busy, sync } = useContext(SyncCtx);
  return (
    <Button type="button" onClick={sync} disabled={busy} className={className}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {label}
    </Button>
  );
}

/** Renders `skeleton` while a sync is in progress, otherwise the real `children`. */
export function SyncGate({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  const { busy } = useContext(SyncCtx);
  return <>{busy ? skeleton : children}</>;
}

/* ------------------------------ skeletons ------------------------------ */

function StatChipSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
      <Skeleton className="size-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function DashboardMainSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <StatChipSkeleton key={i} />
        ))}
      </div>

      <section>
        <Skeleton className="mb-4 h-5 w-52" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <Skeleton className="h-5 w-36" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </section>
    </div>
  );
}

export function DashboardAsideSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <Skeleton className="h-5 w-28 self-start" />
        <Skeleton className="size-36 rounded-full" />
        <Skeleton className="h-3 w-44" />
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <Skeleton className="h-5 w-32" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
