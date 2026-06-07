"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import type { Role } from "@timeup/core";
import { Sidebar } from "./sidebar";

/** Hamburger + left drawer holding the sidebar nav — visible only below `lg`. */
export function MobileNav({ role, brandName, logoUrl }: { role: Role; brandName: string; logoUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // close the drawer on client navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir menu"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary lg:hidden"
        >
          <Menu className="size-[18px]" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dlg-overlay fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm lg:hidden" />
        <DialogPrimitive.Content className="drawer-in fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] overflow-y-auto bg-sidebar shadow-panel outline-none lg:hidden">
          <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-3 top-6 grid size-8 place-items-center rounded-lg text-sidebar-muted outline-none transition-colors hover:bg-secondary"
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
          <Sidebar role={role} brandName={brandName} logoUrl={logoUrl} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
