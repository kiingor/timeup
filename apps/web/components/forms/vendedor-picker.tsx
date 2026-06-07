"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { listSoftcomVendedores } from "@/app/(admin)/app/integracao/actions";

type Vendedor = { id: number; nome: string; email?: string | null };

export function VendedorPicker({
  empresaId,
  onSelect,
  label = "Buscar no Softcom",
  variant = "outline",
  size = "sm",
  triggerClassName,
}: {
  empresaId: string;
  onSelect: (id: number, nome: string) => void;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[] | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    if (vendedores) return;
    if (!empresaId) {
      toast.error("Selecione a empresa primeiro.");
      setVendedores([]);
      return;
    }
    setLoading(true);
    try {
      const res = await listSoftcomVendedores(empresaId);
      if (!res.ok) {
        toast.error(res.error);
        setVendedores([]);
        return;
      }
      setVendedores(res.vendedores);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!vendedores) return [];
    const q = query.trim().toLowerCase();
    if (!q) return vendedores;
    return vendedores.filter((v) => v.nome.toLowerCase().includes(q) || String(v.id).includes(q));
  }, [vendedores, query]);

  return (
    <DropdownMenu onOpenChange={(open) => (open ? load() : setQuery(""))}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={variant} size={size} className={triggerClassName}>
          <Search className="size-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <DropdownMenuLabel className="px-3 pt-3">Vendedores Softcom</DropdownMenuLabel>
        <div className="px-2 pb-2 pt-1">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Buscar por nome ou código..."
            className="h-8"
          />
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-64 overflow-y-auto py-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {vendedores && vendedores.length > 0 ? "Nenhum vendedor para esta busca." : "Nenhum vendedor encontrado."}
            </p>
          )}
          {!loading &&
            filtered.map((v) => (
              <DropdownMenuItem key={v.id} onSelect={() => onSelect(v.id, v.nome)} className="mx-1">
                <Plug className="size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{v.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">Código #{v.id}</p>
                </div>
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
