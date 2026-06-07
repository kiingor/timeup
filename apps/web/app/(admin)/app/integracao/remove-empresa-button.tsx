"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteEmpresa } from "./actions";

export function RemoveEmpresaButton({ id, name, colaboradorCount }: { id: string; name: string; colaboradorCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const res = await deleteEmpresa(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Empresa removida.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="size-4" />
          Remover
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remover empresa</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 rounded-xl bg-destructive/8 p-3 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <p>
            Remover <strong>{name}</strong> apaga a conexão Softcom dela
            {colaboradorCount > 0 ? (
              <>
                {" "}e <strong>{colaboradorCount} colaborador(es)</strong> com suas metas, histórico de vendas e logins.
              </>
            ) : (
              "."
            )}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Remover empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
