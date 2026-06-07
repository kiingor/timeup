import { Gamepad2 } from "lucide-react";
import { getTenantDb } from "@timeup/db";
import { requireColaborador } from "@/lib/session";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PasswordForm } from "@/components/forms/password-form";
import { VehiclePicker } from "./vehicle-picker";

export default async function ColaboradorPerfilPage() {
  const user = await requireColaborador();
  const colab = await getTenantDb(user.tenantId).colaborador.findUnique({
    where: { id: user.colaboradorId },
    select: { vehicle: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Meu perfil" description="Seus dados, personagem e segurança." />

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <Avatar className="size-14">
          <AvatarFallback className="bg-brand/15 text-lg text-brand">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-extrabold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold">
          <Gamepad2 className="size-5 text-brand" />
          Seu personagem
        </h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
          Escolha o carro ou moto que vai te representar na corrida do ranking.
        </p>
        <VehiclePicker current={colab?.vehicle ?? null} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-bold">Alterar senha</h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">Use uma senha forte que você não usa em outros lugares.</p>
        <PasswordForm />
      </section>
    </div>
  );
}
