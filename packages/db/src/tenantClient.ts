import { basePrisma } from "./client";

/**
 * Models that carry a `tenantId` column and must always be tenant-scoped.
 * (User, Tenant and AuditLog are intentionally excluded — they are handled with
 * explicit scoping because auth/login lookups and master operations cross tenants.)
 */
const SCOPED_MODELS = new Set<string>([
  "TenantSoftcomConfig",
  "Empresa",
  "Colaborador",
  "MetaTier",
  "MonthlyStoreGoal",
  "ColaboradorGoal",
  "SalesDaily",
  "SalesMonthly",
  "StoreMonthly",
  "MonthSettings",
  "SyncRun",
  "Notification",
]);

const READ_OPS = new Set<string>([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

// operations that filter rows via `where`
const WHERE_OPS = new Set<string>(["update", "updateMany", "updateManyAndReturn", "delete", "deleteMany", "upsert"]);

// operations that insert rows via `data`
const CREATE_OPS = new Set<string>(["create", "createMany", "createManyAndReturn"]);

/**
 * Returns a Prisma client whose every read/write on a tenant-scoped model is
 * automatically constrained to `tenantId`. This eliminates the classic "forgot the
 * WHERE tenantId" cross-tenant leak. Request code must use this — never `basePrisma`.
 *
 * Note: Prisma 6 allows additional non-unique filters on `findUnique`/`update`/`delete`
 * `where` inputs (alongside the unique selector), so injecting `tenantId` there is safe
 * and turns a wrong-tenant lookup into a clean null/`RecordNotFound`.
 */
export function getTenantDb(tenantId: string) {
  if (!tenantId) throw new Error("getTenantDb requires a tenantId");

  return basePrisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async $allOperations({ model, operation, args, query }: any) {
          if (!model || !SCOPED_MODELS.has(model)) {
            return query(args);
          }
          const next = { ...(args ?? {}) };

          if (READ_OPS.has(operation) || WHERE_OPS.has(operation)) {
            next.where = { ...(next.where ?? {}), tenantId };
          }
          if (CREATE_OPS.has(operation)) {
            const data = next.data;
            next.data = Array.isArray(data)
              ? data.map((row: Record<string, unknown>) => ({ ...row, tenantId }))
              : { ...(data ?? {}), tenantId };
          }
          if (operation === "upsert") {
            next.create = { ...(next.create ?? {}), tenantId };
          }
          return query(next);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof getTenantDb>;
