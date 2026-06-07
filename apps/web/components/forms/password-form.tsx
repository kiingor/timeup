"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/app/(colaborador)/me/actions";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await changePassword(current, next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Senha alterada com sucesso.");
      setCurrent("");
      setNext("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">Senha atual</Label>
        <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">Nova senha</Label>
        <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
      </div>
      <Button onClick={submit} disabled={busy || !current || !next}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        Alterar senha
      </Button>
    </div>
  );
}
