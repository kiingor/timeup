"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { normalizeTheme, type ThemeInput, type ThemeTokens } from "@timeup/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BrandingFields } from "@/components/forms/branding-fields";
import { updateTenant, updateTenantTheme } from "../../actions";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-bold">{title}</h2>
      {description && <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function EditTenantForm({
  id,
  initialName,
  initialActive,
  initialTheme,
}: {
  id: string;
  initialName: string;
  initialActive: boolean;
  initialTheme: ThemeTokens;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [theme, setTheme] = useState<ThemeInput>(initialTheme);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const r1 = await updateTenant(id, { name, status: active ? "active" : "suspended" });
      if (!r1.ok) {
        toast.error(r1.error);
        return;
      }
      const r2 = await updateTenantTheme(id, normalizeTheme(theme));
      if (!r2.ok) {
        toast.error(r2.error);
        return;
      }
      toast.success("Alterações salvas.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Dados da empresa">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex h-9 items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <span className="text-sm font-medium">{active ? "Ativa" : "Suspensa"}</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Identidade visual" description="Cores aplicadas ao painel desta empresa.">
        <BrandingFields value={theme} onChange={setTheme} />
      </Section>

      <div className="flex items-center justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
