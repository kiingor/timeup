"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Target, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { setColaboradorGoals } from "@/app/(admin)/app/actions";

export interface GoalTier {
  id: string;
  name: string;
  color: string | null;
}

interface GoalDraft {
  target: number;
  bonus: number;
}

export function GoalsEditor({
  colaboradorId,
  year,
  month,
  tiers,
  initial,
}: {
  colaboradorId: string;
  year: number;
  month: number;
  tiers: GoalTier[];
  initial: Record<string, { target: number; bonus: number }>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, GoalDraft>>(() =>
    Object.fromEntries(tiers.map((t) => [t.id, { target: initial[t.id]?.target ?? 0, bonus: initial[t.id]?.bonus ?? 0 }])),
  );
  const [saving, setSaving] = useState(false);

  function setField(tierId: string, field: keyof GoalDraft, v: number) {
    setValues((s) => ({ ...s, [tierId]: { target: 0, bonus: 0, ...s[tierId], [field]: v } }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await setColaboradorGoals(
        colaboradorId,
        year,
        month,
        tiers.map((t) => ({ metaTierId: t.id, targetBrl: values[t.id]?.target ?? 0, bonusBrl: values[t.id]?.bonus || null })),
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Metas salvas.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (tiers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum nível de meta ativo. Configure os níveis em Configurações → Níveis de meta.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.id} className="space-y-3 rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: t.color ?? "var(--brand)" }} />
              {t.name}
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Meta (R$)</Label>
              <MoneyInput value={values[t.id]?.target ?? 0} onValueChange={(v) => setField(t.id, "target", v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Gift className="size-3.5" />
                Prêmio ao atingir <span className="font-normal">(opcional)</span>
              </Label>
              <MoneyInput value={values[t.id]?.bonus ?? 0} onValueChange={(v) => setField(t.id, "bonus", v)} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Target className="size-3.5" />
          Os valores em R$ ficam só com a gestão — o colaborador vê só o prêmio quando atinge a meta.
        </p>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Salvar metas
        </Button>
      </div>
    </div>
  );
}
