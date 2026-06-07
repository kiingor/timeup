"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createTenantSchema, type CreateTenantInput, DEFAULT_THEME } from "@timeup/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandingFields } from "@/components/forms/branding-fields";
import { createTenant } from "../../actions";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-bold">{title}</h2>
      {description && <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function NewTenantForm() {
  const router = useRouter();
  const [slugEdited, setSlugEdited] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      softcomDeviceUrl: "",
      theme: DEFAULT_THEME,
    },
  });

  const theme = watch("theme");

  async function onSubmit(values: CreateTenantInput) {
    setServerError(null);
    const res = await createTenant(values);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    toast.success("Empresa criada com sucesso!");
    router.push(res.id ? `/master/empresas/${res.id}` : "/master/empresas");
    router.refresh();
  }

  const onError = (errs: Record<string, unknown>) => {
    setServerError("Verifique os campos: " + Object.keys(errs).join(", "));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6" noValidate>
      <Section title="Dados da empresa">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa</Label>
            <Input
              id="name"
              placeholder="Loja Centro"
              {...register("name", {
                onChange: (e) => {
                  if (!slugEdited) setValue("slug", slugify(e.target.value), { shouldValidate: true });
                },
              })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Identificador (slug)</Label>
            <Input
              id="slug"
              placeholder="loja-centro"
              {...register("slug", { onChange: () => setSlugEdited(true) })}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
        </div>
      </Section>

      <Section title="Administrador" description="O primeiro usuário admin desta empresa.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="adminName">Nome do admin</Label>
            <Input id="adminName" placeholder="Maria Gestora" {...register("adminName")} />
            {errors.adminName && <p className="text-xs text-destructive">{errors.adminName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">E-mail</Label>
            <Input id="adminEmail" type="email" placeholder="admin@empresa.com" {...register("adminEmail")} />
            {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="adminPassword">Senha provisória</Label>
            <Input id="adminPassword" type="text" placeholder="Mínimo 8 caracteres" {...register("adminPassword")} />
            {errors.adminPassword && <p className="text-xs text-destructive">{errors.adminPassword.message}</p>}
          </div>
        </div>
      </Section>

      <Section title="Identidade visual" description="Cores padrão da empresa — o admin pode ajustar depois.">
        <BrandingFields value={theme} onChange={(t) => setValue("theme", t, { shouldValidate: true })} />
      </Section>

      <Section
        title="Integração Softcom (opcional)"
        description="Cole a URL de device/add para já registrar a empresa. A conexão é finalizada na tela de Integração."
      >
        <div className="space-y-2">
          <Label htmlFor="softcomDeviceUrl">URL do device/add</Label>
          <Input
            id="softcomDeviceUrl"
            placeholder="https://selfhost.softcomservices.com/INSTANCIA/device/add?client_id=..."
            {...register("softcomDeviceUrl")}
          />
          {errors.softcomDeviceUrl && <p className="text-xs text-destructive">{errors.softcomDeviceUrl.message}</p>}
        </div>
      </Section>

      {serverError && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline">
          <Link href="/master/empresas">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Criar empresa
        </Button>
      </div>
    </form>
  );
}
