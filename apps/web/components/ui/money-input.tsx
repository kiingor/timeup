"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BRL currency mask. Digits fill from the right (cents-first), so typing
 * 6 0 0 0 0 0 0 reads 0,06 → 0,60 → 6,00 → 60,00 → 600,00 → 6.000,00 → 60.000,00.
 *
 * `value` is in reais (number); `onValueChange` reports reais. Internally we track
 * integer cents to avoid float drift and the reformat-while-typing bug.
 */
const fmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toCents(reais: number): number {
  return Math.round((Number.isFinite(reais) ? reais : 0) * 100);
}

export function MoneyInput({
  value,
  onValueChange,
  className,
  id,
  placeholder = "0,00",
  disabled,
}: {
  value: number;
  onValueChange: (v: number) => void;
  className?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [cents, setCents] = React.useState<number>(() => toCents(value));

  // Re-sync only when the external value diverges (initial load / reset),
  // never while the user is typing (which keeps cents in step already).
  React.useEffect(() => {
    const ext = toCents(value);
    setCents((cur) => (cur === ext ? cur : ext));
  }, [value]);

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 13); // cap to avoid overflow
    const next = digits ? parseInt(digits, 10) : 0;
    setCents(next);
    onValueChange(next / 100);
  }

  const display = cents > 0 ? fmt.format(cents / 100) : "";

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        value={display}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-right text-sm tabnums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
