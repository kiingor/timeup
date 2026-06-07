/**
 * Money helpers. Values are plain numbers in BRL (reais, not cents) at this layer;
 * the database stores them as Decimal(14,2). Format to a string only at the UI edge,
 * and only in admin/master contexts.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BRL_COMPACT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Round to 2 decimal places (cents), avoiding binary float drift. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** "R$ 1.234,56" */
export function formatBRL(value: number): string {
  return BRL.format(Number.isFinite(value) ? value : 0);
}

/** "R$ 1,2 mil" — for dense dashboard cards. */
export function formatBRLCompact(value: number): string {
  return BRL_COMPACT.format(Number.isFinite(value) ? value : 0);
}

/**
 * Parse a pt-BR currency string ("1.234,56", "R$ 1.234,56", "60000") into a number.
 * Returns null when it cannot be parsed.
 */
export function parseBRLInput(input: string): number | null {
  if (input == null) return null;
  const cleaned = input
    .toString()
    .replace(/\s/g, "")
    .replace(/^R\$/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? roundMoney(n) : null;
}
