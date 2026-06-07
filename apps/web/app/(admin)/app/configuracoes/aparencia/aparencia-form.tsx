"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ThemeInput } from "@timeup/core";
import { Button } from "@/components/ui/button";
import { BrandingFields } from "@/components/forms/branding-fields";
import { LogoUpload } from "@/components/forms/logo-upload";
import { updateOwnTenantTheme } from "../actions";

export function AparenciaForm({ initialTheme }: { initialTheme: ThemeInput }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeInput>(initialTheme);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await updateOwnTenantTheme(theme);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Aparência salva.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-bold">Marca</h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">Logo exibida na barra lateral e no login.</p>
        <LogoUpload value={theme.logoUrl ?? null} onChange={(url) => setTheme({ ...theme, logoUrl: url })} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-bold">Cores</h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">Personalize a identidade visual da empresa.</p>
        <BrandingFields value={theme} onChange={setTheme} />
      </section>

      <div className="flex items-center justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Salvar aparência
        </Button>
      </div>
    </div>
  );
}
