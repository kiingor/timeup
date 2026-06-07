"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAdminUser } from "./actions";

export function NovoUsuarioDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await createAdminUser({ name, email, password });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Administrador criado.");
      setOpen(false);
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo administrador</DialogTitle>
          <DialogDescription>Cria um acesso de administrador para esta empresa.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uName">Nome</Label>
            <Input id="uName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Silva" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uEmail">E-mail</Label>
            <Input id="uEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uPass">Senha provisória</Label>
            <Input id="uPass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
