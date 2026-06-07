"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ColaboradorForm, type EmpresaChoice } from "@/components/forms/colaborador-form";

/** "Novo colaborador" as a modal. Pass `children` to use a custom trigger. */
export function NovoColaboradorDialog({ empresas, children }: { empresas: EmpresaChoice[]; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="size-4" />
            Novo colaborador
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo colaborador</DialogTitle>
          <DialogDescription>Cadastre um membro da equipe.</DialogDescription>
        </DialogHeader>
        <ColaboradorForm mode="create" layout="dialog" empresas={empresas} onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
