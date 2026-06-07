"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { provisionDevice, triggerSync, triggerSyncEmpresa } from "./actions";

export function ProvisionForm({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!url.trim()) {
      toast.error("Cole a URL de device/add.");
      return;
    }
    setBusy(true);
    try {
      const res = await provisionDevice(url.trim());
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Conectado: ${res.empresa ?? "empresa"}`);
      setUrl("");
      onDone?.();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="deviceUrl">{compact ? "Nova URL de device/add" : "URL de device/add"}</Label>
      <div className="flex gap-2">
        <Input
          id="deviceUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://selfhost.softcomservices.com/INSTANCIA/device/add?client_id=..."
        />
        <Button onClick={submit} disabled={busy} className="shrink-0">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Conectar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Geramos e guardamos o client_secret de forma criptografada. A empresa fica vinculada ao CNPJ da URL.
      </p>
    </div>
  );
}

export function SyncNowButton({
  className,
  variant,
  label = "Sincronizar agora",
}: {
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await triggerSync();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Sincronizado — ${res.rows} vendedor(es) atualizado(s).`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={run} disabled={busy} variant={variant} className={className}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {label}
    </Button>
  );
}

/** Sync a single empresa. */
export function SyncEmpresaButton({ empresaId, className }: { empresaId: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await triggerSyncEmpresa(empresaId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Sincronizado — ${res.rows} vendedor(es).`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={run} disabled={busy} className={className}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Sincronizar
    </Button>
  );
}

/** Opens the device/add provisioning form in a modal. */
export function ProvisionDialog({
  trigger,
  title,
  description,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ProvisionForm compact onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
