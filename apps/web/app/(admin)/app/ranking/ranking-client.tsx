"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { setRankingReleased } from "./actions";

/** Toggle that releases/hides the month's ranking for colaboradores (per empresa). */
export function ReleaseRankingToggle({
  year,
  month,
  released,
  empresaId,
}: {
  year: number;
  month: number;
  released: boolean;
  empresaId: string | null;
}) {
  const router = useRouter();
  const [on, setOn] = useState(released);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    if (!empresaId) return;
    setOn(next); // optimistic
    startTransition(async () => {
      const res = await setRankingReleased(empresaId, year, month, next);
      if (!res.ok) {
        setOn(!next); // revert
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Ranking liberado para os colaboradores." : "Ranking ocultado dos colaboradores.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${on ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground"}`}>
          {on ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        </span>
        <div>
          <p className="font-bold leading-tight">Liberar ranking para os colaboradores</p>
          <p className="text-sm text-muted-foreground">
            {!empresaId
              ? "Selecione uma empresa para liberar/ocultar o ranking dela."
              : on
                ? "Os colaboradores estão vendo posições e % (nunca valores em R$)."
                : "O ranking está oculto para os colaboradores neste mês."}
          </p>
        </div>
      </div>
      <Switch checked={on} disabled={pending || !empresaId} onCheckedChange={toggle} aria-label="Liberar ranking" />
    </div>
  );
}
