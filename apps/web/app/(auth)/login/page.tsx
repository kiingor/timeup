import { Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="min-h-svh bg-page p-3 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[1280px] overflow-hidden rounded-[28px] bg-card shadow-panel sm:min-h-[calc(100svh-2rem)] lg:grid-cols-2">
        {/* brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-hero p-10 text-white lg:flex">
          <svg className="pointer-events-none absolute -right-10 top-10 h-72 w-72 text-white/15" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L57 43 L100 50 L57 57 L50 100 L43 57 L0 50 L43 43 Z" />
          </svg>
          <svg className="pointer-events-none absolute bottom-16 right-24 h-28 w-28 text-white/10" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L57 43 L100 50 L57 57 L50 100 L43 57 L0 50 L43 43 Z" />
          </svg>
          <div className="flex items-center gap-2.5 font-extrabold">
            <span className="grid size-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
              <Sparkles className="size-5" />
            </span>
            <span className="text-lg">TimeUp</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold leading-[1.1]">
              Metas claras. <br /> Evolução em tempo real.
            </h1>
            <p className="max-w-sm text-sm text-white/80">
              Acompanhe o desempenho da loja e de cada colaborador, com sincronização automática de vendas.
            </p>
          </div>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} TimeUp</p>
        </div>

        {/* form panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-foreground">
                <Sparkles className="size-5" />
              </span>
              <span className="text-lg font-extrabold">TimeUp</span>
            </div>
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight">Entrar</h2>
              <p className="mt-1 text-sm text-muted-foreground">Acesse com seu e-mail e senha.</p>
            </div>
            <LoginForm callbackUrl={callbackUrl} />
          </div>
        </div>
      </div>
    </main>
  );
}
