/**
 * Shared domain types for TimeUp. These are framework-agnostic and safe to import
 * from the web app, the worker, and tests.
 */

export type Role = "master" | "admin" | "colaborador";

export const ROLES: Role[] = ["master", "admin", "colaborador"];

/** Shape stored in the NextAuth JWT/session. */
export interface SessionUser {
  userId: string;
  role: Role;
  /** null only for `master`. */
  tenantId: string | null;
  /** present only when role === "colaborador". */
  colaboradorId?: string | null;
  name: string;
  email: string;
}

/** A single meta tier definition (e.g. Normal / Média / Agressiva). */
export interface MetaTier {
  id: string;
  name: string;
  orderIndex: number;
  color: string | null;
}

/**
 * Per-tier progress as the COLABORADOR is allowed to see it.
 * IMPORTANT: this DTO intentionally carries NO monetary value (neither the target
 * nor the realized amount). Percentages only. Enforced server-side (see web/lib/dto).
 */
export interface ColaboradorTierDTO {
  tierId: string;
  tierName: string;
  color: string | null;
  /** 0..N, where 1 == 100% of this tier reached. May exceed 1. */
  pctOfTier: number;
  /** max(0, 1 - pctOfTier). */
  pctRemaining: number;
  reached: boolean;
  /**
   * The prize (R$) earned for this tier — the ONE monetary value a colaborador may see.
   * Server-enforced: populated ONLY when `reached` is true; null otherwise (so the amount
   * never reaches the client before it is earned).
   */
  bonusBrl: number | null;
  /** whether this tier has a prize at all — lets the UI tease it without revealing the amount. */
  hasBonus: boolean;
}

/** A point on the colaborador daily-evolution curve — percentage only, never R$. */
export interface ColaboradorEvolutionPointDTO {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Cumulative percentage of the *reference* tier reached by end of this day. */
  cumulativePct: number;
}

/** The full colaborador dashboard payload. No R$ anywhere. */
export interface ColaboradorDashboardDTO {
  colaboradorName: string;
  periodYear: number;
  periodMonth: number;
  tiers: ColaboradorTierDTO[];
  /** evolution measured against the first (lowest) assigned tier as reference. */
  evolution: ColaboradorEvolutionPointDTO[];
  /** present only if ranking was released for this month by the admin. */
  rankPosition: number | null;
  rankReleased: boolean;
}

/** Admin-facing per-tier progress — includes the real R$ values. */
export interface AdminTierProgress {
  tierId: string;
  tierName: string;
  color: string | null;
  targetBrl: number;
  realizedBrl: number;
  pctOfTier: number;
  pctRemaining: number;
  amountRemainingBrl: number;
  reached: boolean;
}

export type SyncStatus = "running" | "success" | "partial" | "error";
export type SalesSource = "rankingvendedor" | "pre_venda_v1" | "pre_venda_v2" | "manual" | "seed";
