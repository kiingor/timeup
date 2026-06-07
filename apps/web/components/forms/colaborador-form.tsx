"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Lock, Plug, ArrowRight, Store } from "lucide-react";
import { colaboradorSchema, type ColaboradorInput } from "@timeup/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { VendedorPicker } from "@/components/forms/vendedor-picker";
import { createColaborador, updateColaborador } from "@/app/(admin)/app/actions";

export interface EmpresaChoice {
  id: string;
  name: string;
}

function Section({
  title,
  description,
  flat,
  children,
}: {
  title: string;
  description?: string;
  flat?: boolean;
  children: React.ReactNode;
}) {
  if (flat) {
    return (
      <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
        <h3 className="text-sm font-bold">{title}</h3>
        {description && <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{description}</p>}
        <div className={description ? "" : "mt-3"}>{children}</div>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-bold">{title}</h2>
      {description && <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function ColaboradorForm({
  mode,
  id,
  initial,
  empresas,
  hasLogin = false,
  layout = "page",
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: Partial<ColaboradorInput>;
  empresas: EmpresaChoice[];
  hasLogin?: boolean;
  layout?: "page" | "dialog";
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const flat = layout === "dialog";
  const [serverError, setServerError] = useState<string | null>(null);

  // vendedor link state (drives the locked código + the create-flow gate)
  const [vendedor, setVendedor] = useState<{ id: string; nome: string } | null>(
    initial?.softcomVendedorId ? { id: String(initial.softcomVendedorId), nome: initial?.softcomVendedorNome ?? "" } : null,
  );
  const [skipLink, setSkipLink] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ColaboradorInput>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: {
      empresaId: initial?.empresaId ?? (empresas.length === 1 ? empresas[0]!.id : ""),
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      softcomVendedorId: initial?.softcomVendedorId ?? "",
      softcomVendedorNome: initial?.softcomVendedorNome ?? "",
      active: initial?.active ?? true,
      createLogin: false,
      loginPassword: "",
    },
  });

  const active = watch("active");
  const createLogin = watch("createLogin");
  const empresaId = watch("empresaId");

  const linked = vendedor !== null;
  // create flow: choose empresa → pick vendedor → rest
  const needEmpresa = mode === "create" && !empresaId;
  const showVendedorStep = mode === "create" && !!empresaId && !linked && !skipLink;
  const showRest = !needEmpresa && !showVendedorStep;

  function chooseEmpresa(eid: string) {
    setValue("empresaId", eid, { shouldValidate: true });
  }

  function handleSelectVendedor(vid: number, nome: string) {
    setVendedor({ id: String(vid), nome });
    setSkipLink(false);
    setValue("softcomVendedorId", String(vid), { shouldValidate: true });
    setValue("softcomVendedorNome", nome);
    // pre-fill the name from Softcom (don't clobber an already-typed name on edit)
    if (mode === "create" || !getValues("name")?.trim()) setValue("name", nome, { shouldValidate: true });
  }

  function changeEmpresaOnEdit(eid: string) {
    setValue("empresaId", eid, { shouldValidate: true });
    // the código belongs to the old empresa's connection — clear it so the admin re-links
    setVendedor(null);
    setSkipLink(true);
    setValue("softcomVendedorId", "");
    setValue("softcomVendedorNome", "");
  }

  async function onSubmit(values: ColaboradorInput) {
    setServerError(null);
    const res = mode === "create" ? await createColaborador(values) : await updateColaborador(id!, values);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    toast.success(mode === "create" ? "Colaborador criado." : "Colaborador atualizado.");
    onSuccess?.();
    if (mode === "create") router.push(res.id ? `/app/colaboradores/${res.id}` : "/app/colaboradores");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, (e) => setServerError("Verifique os campos: " + Object.keys(e).join(", ")))} className={flat ? "space-y-5" : "space-y-6"} noValidate>
      {/* STEP 0 (create): pick the empresa the colaborador belongs to */}
      {needEmpresa ? (
        <Section flat={flat} title="Empresa" description="Selecione a empresa (loja) à qual este colaborador pertence.">
          {empresas.length === 0 ? (
            <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
              Nenhuma empresa conectada. Conecte uma empresa em Configurações → Integração antes de cadastrar colaboradores.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {empresas.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => chooseEmpresa(e.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-brand hover:bg-secondary/50"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-brand/12 text-brand">
                    <Store className="size-4" />
                  </span>
                  <span className="truncate text-sm font-semibold">{e.name}</span>
                </button>
              ))}
            </div>
          )}
        </Section>
      ) : showVendedorStep ? (
        /* STEP 1 (create): pick the Softcom vendedor — it fills name + código */
        <Section
          flat={flat}
          title="Vincular vendedor Softcom"
          description="Selecione o vendedor desta empresa. O nome e o código serão preenchidos automaticamente."
        >
          <div className="flex flex-col items-start gap-3">
            <VendedorPicker empresaId={empresaId} onSelect={handleSelectVendedor} label="Buscar no Softcom" variant="default" size="lg" />
            <button
              type="button"
              onClick={() => setSkipLink(true)}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Cadastrar sem vínculo Softcom
            </button>
          </div>
        </Section>
      ) : (
        <>
          {/* Vendedor link summary + locked código */}
          <Section flat={flat} title="Vendedor Softcom">
            {linked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/8 p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                    <Plug className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Vinculado ao Softcom</p>
                    <p className="truncate text-xs text-muted-foreground">{vendedor!.nome || "Vendedor"}</p>
                  </div>
                  <VendedorPicker empresaId={empresaId} onSelect={handleSelectVendedor} label="Trocar" variant="outline" size="sm" />
                </div>
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="softcomVendedorId">Código do vendedor</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="softcomVendedorId"
                      readOnly
                      tabIndex={-1}
                      {...register("softcomVendedorId")}
                      className="cursor-not-allowed bg-secondary pl-9 text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Preenchido pelo Softcom — não pode ser alterado.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3">
                <p className="text-sm text-muted-foreground">Sem vínculo Softcom — este colaborador não será sincronizado.</p>
                <VendedorPicker empresaId={empresaId} onSelect={handleSelectVendedor} label="Vincular vendedor" variant="outline" size="sm" />
              </div>
            )}
          </Section>

          {/* Dados do colaborador */}
          <Section flat={flat} title="Dados do colaborador">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empresaId">Empresa</Label>
                <select
                  id="empresaId"
                  value={empresaId}
                  onChange={(e) => changeEmpresaOnEdit(e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                >
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {errors.empresaId && <p className="text-xs text-destructive">{errors.empresaId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Oziel Santos" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="oziel@empresa.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex h-9 items-center gap-3">
                  <Switch checked={active} onCheckedChange={(v) => setValue("active", v)} />
                  <span className="text-sm font-medium">{active ? "Ativo" : "Inativo"}</span>
                </div>
              </div>
            </div>
          </Section>

          {!hasLogin && (
            <Section flat={flat} title="Acesso do colaborador" description="Opcional. Crie um login para o colaborador acompanhar o próprio desempenho.">
              <div className="flex items-center gap-3">
                <Switch checked={createLogin} onCheckedChange={(v) => setValue("createLogin", v)} />
                <span className="text-sm font-medium">Criar login agora</span>
              </div>
              {createLogin && (
                <div className="mt-4 max-w-sm space-y-2">
                  <Label htmlFor="loginPassword">Senha provisória</Label>
                  <Input id="loginPassword" type="text" placeholder="Mínimo 8 caracteres" {...register("loginPassword")} />
                  <p className="text-xs text-muted-foreground">O login usa o e-mail informado acima.</p>
                </div>
              )}
            </Section>
          )}

          {serverError && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</div>}

          <div className="flex items-center justify-end gap-3">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/app/colaboradores">Cancelar</Link>
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "create" ? "Criar colaborador" : "Salvar"}
            </Button>
          </div>
        </>
      )}

      {/* hint shown only on the create gate */}
      {mode === "create" && !showRest && empresas.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {needEmpresa ? "Selecione a empresa para continuar" : "Selecione um vendedor para continuar o cadastro"}
          <ArrowRight className="size-3.5" />
        </p>
      )}
    </form>
  );
}
