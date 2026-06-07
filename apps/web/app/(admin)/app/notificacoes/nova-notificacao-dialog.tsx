"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Send } from "lucide-react";
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
import { createNotification } from "@/lib/actions/notifications";

export function NovaNotificacaoDialog({ colaboradores }: { colaboradores: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [busy, setBusy] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
    setTarget("all");
  }

  async function submit() {
    if (!title.trim() || !body.trim()) {
      toast.error("Preencha título e mensagem.");
      return;
    }
    setBusy(true);
    try {
      const res = await createNotification({
        title: title.trim(),
        body: body.trim(),
        colaboradorId: target === "all" ? null : target,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(target === "all" ? "Notificação enviada para todos." : "Notificação enviada.");
      setOpen(false);
      reset();
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
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nova notificação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova notificação</DialogTitle>
          <DialogDescription>Envie um aviso para um colaborador ou para todos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notifTarget">Destinatário</Label>
            <select
              id="notifTarget"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos os colaboradores</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notifTitle">Título</Label>
            <Input id="notifTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Parabéns pela meta!" autoFocus maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notifBody">Mensagem</Label>
            <textarea
              id="notifBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva a mensagem..."
              rows={4}
              maxLength={1000}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
