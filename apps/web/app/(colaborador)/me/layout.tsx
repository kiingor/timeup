import { requireColaborador } from "@/lib/session";
import { getTenant, getTenantTheme } from "@/lib/data/tenant";
import { getColaboradorNotifications } from "@/lib/data/notifications";
import { AppShell } from "@/components/shell/app-shell";
import { ThemeStyle } from "@/components/theme-style";
import { PwaInstallPrompt } from "@/components/pwa-install";

export default async function ColaboradorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireColaborador();
  const [tenant, theme, notifications] = await Promise.all([
    getTenant(user.tenantId),
    getTenantTheme(user.tenantId),
    getColaboradorNotifications(user.tenantId, user.colaboradorId),
  ]);

  return (
    <>
      <ThemeStyle theme={theme} />
      <AppShell
        role="colaborador"
        brandName={tenant?.name ?? "TimeUp"}
        logoUrl={theme.logoUrl}
        user={{ name: user.name, email: user.email }}
        notifications={notifications}
      >
        {children}
      </AppShell>
      <PwaInstallPrompt />
    </>
  );
}
