"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { setStoreGoal } from "@/app/(admin)/app/actions";

export function StoreGoalForm({
  year,
  month,
  initial,
  empresaId,
}: {
  year: number;
  month: number;
  initial: number;
  empresaId: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  // editing requires a single empresa selected; under "Todas" the value is a read-only sum
  if (!empresaId) {
    return (
      <div className="text-right text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabnums">{initial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        <p className="text-xs">Soma de todas as empresas. Selecione uma empresa para editar.</p>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await setStoreGoal(empresaId!, year, month, value);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Meta da loja salva.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="w-48">
        <MoneyInput value={value} onValueChange={setValue} />
      </div>
      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Salvar
      </Button>
    </div>
  );
}
