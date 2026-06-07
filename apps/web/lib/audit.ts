import { masterDb } from "@timeup/db";

/**
 * Append an audit-log entry. Never throws — auditing must not break the main action.
 */
export async function writeAudit(
  tenantId: string | null,
  actorUserId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  diff?: Record<string, unknown>,
): Promise<void> {
  try {
    await masterDb.auditLog.create({
      data: {
        tenantId: tenantId ?? null,
        actorUserId: actorUserId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        diff: diff ? (diff as object) : undefined,
      },
    });
  } catch {
    // swallow — auditing is best-effort
  }
}
