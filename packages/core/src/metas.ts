/**
 * Meta percentage math. Percentages are RATIOS here (0..N where 1 == 100%); format
 * with `formatPct` at the edge. Percentages are never persisted — always computed.
 */
import { roundMoney } from "./money";

/**
 * Fraction of a tier reached. Guards target <= 0 (returns 0, never Infinity/NaN).
 * Can exceed 1 when over-achieving — callers decide whether to clamp for display.
 */
export function pctOfTier(realizedBrl: number, targetBrl: number): number {
  if (!Number.isFinite(realizedBrl) || !Number.isFinite(targetBrl)) return 0;
  if (targetBrl <= 0) return 0;
  return Math.max(0, realizedBrl) / targetBrl;
}

/** How much of the tier remains, as a fraction in [0, 1]. */
export function pctRemaining(realizedBrl: number, targetBrl: number): number {
  return Math.max(0, 1 - pctOfTier(realizedBrl, targetBrl));
}

/** Remaining R$ to reach the tier (admin-only — leaks the target). */
export function amountRemainingBrl(realizedBrl: number, targetBrl: number): number {
  if (targetBrl <= 0) return 0;
  return roundMoney(Math.max(0, targetBrl - Math.max(0, realizedBrl)));
}

export function reachedTier(realizedBrl: number, targetBrl: number): boolean {
  return targetBrl > 0 && realizedBrl >= targetBrl;
}

/** Clamp a ratio to [0, 1] for progress bars. */
export function clampPct(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(1, Math.max(0, ratio));
}

const PCT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Format a ratio (0..N) as "84,2%". */
export function formatPct(ratio: number): string {
  return PCT.format(Number.isFinite(ratio) ? ratio : 0);
}
