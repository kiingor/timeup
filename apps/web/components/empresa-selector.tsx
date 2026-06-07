"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Store, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface EmpresaOption {
  id: string;
  name: string;
}

/**
 * Admin-only filter mirroring MonthSelector. Writes ?empresa= ("all" = Todas) while
 * preserving the ?ano/?mes params. Hidden when the tenant has a single empresa.
 */
export function EmpresaSelector({ empresas, selected }: { empresas: EmpresaOption[]; selected: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (empresas.length <= 1) return null; // nothing to filter

  function go(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("empresa");
    else params.set("empresa", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const current = selected ? empresas.find((e) => e.id === selected)?.name ?? "Empresa" : "Todas as empresas";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold outline-none transition-colors hover:bg-secondary">
        <Store className="size-4 text-muted-foreground" />
        {current}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        <DropdownMenuItem
          onSelect={() => go("all")}
          className={selected === null ? "bg-secondary font-semibold" : ""}
        >
          Todas as empresas
        </DropdownMenuItem>
        {empresas.map((e) => (
          <DropdownMenuItem
            key={e.id}
            onSelect={() => go(e.id)}
            className={selected === e.id ? "bg-secondary font-semibold" : ""}
          >
            {e.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
