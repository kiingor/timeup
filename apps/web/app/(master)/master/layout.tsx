import { requireMaster } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const user = await requireMaster();
  return (
    <AppShell role="master" brandName="TimeUp" user={{ name: user.name, email: user.email }}>
      {children}
    </AppShell>
  );
}
