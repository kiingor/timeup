"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <Button variant="outline" size="sm" className={className} onClick={() => signOut({ callbackUrl: "/login" })}>
      <LogOut className="size-4" />
      Sair
    </Button>
  );
}
