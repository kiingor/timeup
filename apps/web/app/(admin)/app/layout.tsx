import { requireAdmin } from "@/lib/session";
import { getTenant, getTenantTheme } from "@/lib/data/tenant";
import { AppShell } from "@/components/shell/app-shell";
import { ThemeStyle } from "@/components/theme-style";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [tenant, theme] = await Promise.all([getTenant(user.tenantId), getTenantTheme(user.tenantId)]);

  return (
    <>
      <ThemeStyle theme={theme} />
      <AppShell role="admin" brandName={tenant?.name ?? "TimeUp"} logoUrl={theme.logoUrl} user={{ name: user.name, email: user.email }}>
        {children}
      </AppShell>
    </>
  );
}
