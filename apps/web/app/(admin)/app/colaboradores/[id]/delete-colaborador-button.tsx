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
import { deleteColaborador } from "@/app/(admin)/app/actions";

export function DeleteColaboradorButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const res = await deleteColaborador(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Colaborador excluído.");
      setOpen(false);
      router.push("/app/colaboradores");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="size-4" />
          Excluir colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir colaborador</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 rounded-xl bg-destructive/8 p-3 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <p>
            Excluir <strong>{name}</strong> remove o colaborador, suas metas, o histórico de vendas e o login (se houver).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
