import type { Role } from "@timeup/core";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { NotificationItem } from "@/lib/data/notifications";

export function AppShell({
  role,
  brandName,
  logoUrl,
  user,
  notifications,
  children,
}: {
  role: Role;
  brandName: string;
  logoUrl?: string | null;
  user: { name: string; email: string };
  notifications?: { items: NotificationItem[]; unread: number };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-page p-3 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[1640px] grid-cols-1 overflow-hidden rounded-[28px] bg-card shadow-panel sm:min-h-[calc(100svh-2rem)] lg:grid-cols-[264px_1fr]">
        <div className="hidden border-r border-sidebar-border lg:block">
          <Sidebar role={role} brandName={brandName} logoUrl={logoUrl ?? null} />
        </div>
        <div className="flex min-w-0 flex-col">
          <Topbar user={user} role={role} brandName={brandName} logoUrl={logoUrl ?? null} notifications={notifications} />
          <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
