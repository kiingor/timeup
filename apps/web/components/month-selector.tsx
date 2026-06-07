"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { periodLabel, recentPeriods } from "@/lib/period";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function MonthSelector({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const options = recentPeriods(12);

  function go(y: number, m: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ano", String(y));
    params.set("mes", String(m));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold outline-none transition-colors hover:bg-secondary">
        <Calendar className="size-4 text-muted-foreground" />
        {periodLabel(year, month)}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        {options.map((p) => (
          <DropdownMenuItem
            key={`${p.year}-${p.month}`}
            onSelect={() => go(p.year, p.month)}
            className={p.year === year && p.month === month ? "bg-secondary font-semibold" : ""}
          >
            {periodLabel(p.year, p.month)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
