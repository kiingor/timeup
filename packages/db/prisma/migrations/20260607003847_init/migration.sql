-- CreateEnum
CREATE TYPE "Role" AS ENUM ('master', 'admin', 'colaborador');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "SyncStatusEnum" AS ENUM ('running', 'success', 'partial', 'error');

-- CreateEnum
CREATE TYPE "SalesSourceEnum" AS ENUM ('rankingvendedor', 'pre_venda_v1', 'pre_venda_v2', 'manual', 'seed');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "theme" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSoftcomConfig" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "urlBase" TEXT NOT NULL,
    "instance" TEXT NOT NULL,
    "accountClientId" TEXT,
    "clientId" TEXT,
    "clientSecretEnc" BYTEA,
    "clientSecretIv" BYTEA,
    "clientSecretTag" BYTEA,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "softcomEmpresaId" INTEGER,
    "empresaCnpj" TEXT,
    "empresaName" TEXT,
    "provisionedAt" TIMESTAMPTZ(6),
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastToken" TEXT,
    "lastTokenExpiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TenantSoftcomConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "role" "Role" NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "colaboradorId" UUID,
    "lastLoginAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "softcomVendedorId" TEXT,
    "softcomVendedorNome" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaTier" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MetaTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyStoreGoal" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "targetBrl" DECIMAL(14,2) NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MonthlyStoreGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColaboradorGoal" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "colaboradorId" UUID NOT NULL,
    "metaTierId" UUID NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "targetBrl" DECIMAL(14,2) NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ColaboradorGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesDaily" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "colaboradorId" UUID NOT NULL,
    "saleDate" DATE NOT NULL,
    "realizedBrl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saleCount" INTEGER NOT NULL DEFAULT 0,
    "source" "SalesSourceEnum" NOT NULL,
    "syncedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesMonthly" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "colaboradorId" UUID NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "realizedBrl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "rankPosition" INTEGER,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SalesMonthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMonthly" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "realizedBrl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "budgetBrl" DECIMAL(14,2),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StoreMonthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthSettings" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "rankingReleasedToColaborador" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MonthSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(6),
    "status" "SyncStatusEnum" NOT NULL DEFAULT 'running',
    "endpointSummary" JSONB,
    "rowsUpserted" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "cursor" JSONB,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "diff" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSoftcomConfig_tenantId_key" ON "TenantSoftcomConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_colaboradorId_key" ON "User"("colaboradorId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "Colaborador_tenantId_idx" ON "Colaborador"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_tenantId_softcomVendedorId_key" ON "Colaborador"("tenantId", "softcomVendedorId");

-- CreateIndex
CREATE INDEX "MetaTier_tenantId_idx" ON "MetaTier"("tenantId");

-- CreateIndex
CREATE INDEX "MonthlyStoreGoal_tenantId_idx" ON "MonthlyStoreGoal"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyStoreGoal_tenantId_periodYear_periodMonth_key" ON "MonthlyStoreGoal"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "ColaboradorGoal_tenantId_periodYear_periodMonth_idx" ON "ColaboradorGoal"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "ColaboradorGoal_tenantId_colaboradorId_metaTierId_periodYea_key" ON "ColaboradorGoal"("tenantId", "colaboradorId", "metaTierId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "SalesDaily_tenantId_colaboradorId_idx" ON "SalesDaily"("tenantId", "colaboradorId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesDaily_tenantId_colaboradorId_saleDate_key" ON "SalesDaily"("tenantId", "colaboradorId", "saleDate");

-- CreateIndex
CREATE INDEX "SalesMonthly_tenantId_periodYear_periodMonth_idx" ON "SalesMonthly"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "SalesMonthly_tenantId_colaboradorId_periodYear_periodMonth_key" ON "SalesMonthly"("tenantId", "colaboradorId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "StoreMonthly_tenantId_periodYear_periodMonth_key" ON "StoreMonthly"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "MonthSettings_tenantId_periodYear_periodMonth_key" ON "MonthSettings"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "SyncRun_tenantId_startedAt_idx" ON "SyncRun"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSoftcomConfig" ADD CONSTRAINT "TenantSoftcomConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTier" ADD CONSTRAINT "MetaTier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyStoreGoal" ADD CONSTRAINT "MonthlyStoreGoal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColaboradorGoal" ADD CONSTRAINT "ColaboradorGoal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColaboradorGoal" ADD CONSTRAINT "ColaboradorGoal_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColaboradorGoal" ADD CONSTRAINT "ColaboradorGoal_metaTierId_fkey" FOREIGN KEY ("metaTierId") REFERENCES "MetaTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDaily" ADD CONSTRAINT "SalesDaily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDaily" ADD CONSTRAINT "SalesDaily_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesMonthly" ADD CONSTRAINT "SalesMonthly_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesMonthly" ADD CONSTRAINT "SalesMonthly_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMonthly" ADD CONSTRAINT "StoreMonthly_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthSettings" ADD CONSTRAINT "MonthSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
