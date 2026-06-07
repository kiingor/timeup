"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createMetaTier, updateMetaTier, deleteMetaTier } from "@/app/(admin)/app/actions";

export interface TierRowData {
  id: string;
  name: string;
  color: string | null;
  active: boolean;
}

const PRESETS = ["#64748b", "#2563eb", "#059669", "#7c5cff", "#e0792a", "#db2777", "#dc2626", "#0891b2"];
const DEFAULT_COLOR = "#7c5cff";

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>Cor do nível</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-lg border border-border p-0.5"
          aria-label="Cor personalizada"
        />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={`size-6 rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110 ${value.toLowerCase() === c ? "ring-2 ring-foreground" : ""}`}
              style={{ backgroundColor: c }}
              aria-label={`Usar ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Add or edit a tier in a modal. `tier` present → edit mode. */
function TierDialog({ tier, children }: { tier?: TierRowData; children: React.ReactNode }) {
  const router = useRouter();
  const isEdit = Boolean(tier);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tier?.name ?? "");
  const [color, setColor] = useState(tier?.color ?? DEFAULT_COLOR);
  const [active, setActive] = useState(tier?.active ?? true);
  const [busy, setBusy] = useState(false);

  function reset() {
    setName(tier?.name ?? "");
    setColor(tier?.color ?? DEFAULT_COLOR);
    setActive(tier?.active ?? true);
  }

  async function submit() {
    if (name.trim().length < 1) {
      toast.error("Informe o nome do nível.");
      return;
    }
    setBusy(true);
    try {
      const res = isEdit
        ? await updateMetaTier(tier!.id, { name: name.trim(), color, active })
        : await createMetaTier({ name: name.trim(), color, orderIndex: 0, active: true });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Nível salvo." : "Nível adicionado.");
      setOpen(false);
      if (!isEdit) setName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!tier) return;
    setBusy(true);
    try {
      const res = await deleteMetaTier(tier.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Nível removido.");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar nível" : "Adicionar nível"}</DialogTitle>
          <DialogDescription>Os níveis são usados nas metas dos colaboradores (ex.: Normal, Média, Agressiva).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tierName">Nome do nível</Label>
            <Input id="tierName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meta 4" autoFocus />
          </div>
          <ColorField value={color} onChange={setColor} />
          {isEdit && (
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={active} onCheckedChange={setActive} />
              <span className="text-sm font-medium">{active ? "Ativo" : "Inativo"}</span>
            </div>
          )}
        </div>

        <DialogFooter className={isEdit ? "justify-between" : undefined}>
          {isEdit && (
            <Button type="button" variant="ghost" onClick={remove} disabled={busy} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
              Excluir
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TiersManager({ tiers }: { tiers: TierRowData[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Níveis de meta</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Defina os níveis (ex.: Normal, Média, Agressiva) — adicione quantos quiser.</p>
        </div>
        <TierDialog>
          <Button>
            <Plus className="size-4" />
            Adicionar nível
          </Button>
        </TierDialog>
      </div>

      {tiers.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border py-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Layers className="size-6" />
          </span>
          <p className="mt-3 text-sm font-semibold">Nenhum nível ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro nível de meta.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {tiers.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: t.color ?? DEFAULT_COLOR }} />
              <span className="flex-1 truncate text-sm font-semibold">{t.name}</span>
              {!t.active && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">Inativo</span>}
              <TierDialog tier={t}>
                <Button variant="ghost" size="sm">
                  <Pencil className="size-4" />
                  Editar
                </Button>
              </TierDialog>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
