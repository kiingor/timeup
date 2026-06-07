"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LogoUpload({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Falha no upload.");
        return;
      }
      onChange(json.url);
      toast.success("Logo enviada.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>Logo da empresa</Label>
      <div className="flex items-center gap-4">
        <div className="grid size-16 place-items-center overflow-hidden rounded-xl border border-border bg-secondary">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo" className="size-full object-contain" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={onFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Enviar logo
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Remover logo" className="text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP ou SVG, até 1MB.</p>
    </div>
  );
}
