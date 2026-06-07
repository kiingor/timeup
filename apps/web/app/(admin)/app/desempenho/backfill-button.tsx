"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, History } from "lucide-react";
import { triggerBackfill } from "./actions";

/** Re-pulls the last months from Softcom so the analytics reflect current history. */
export function BackfillButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await triggerBackfill(6);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Histórico sincronizado — ${res.ok_count}/${res.months} meses.`);
      router.refresh();
    });
  }

  return (
    <button
      onClick={run}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/25 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <History className="size-4" />}
      Sincronizar histórico
    </button>
  );
}
