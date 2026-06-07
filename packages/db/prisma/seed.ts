import { hash } from "@node-rs/argon2";
import { DEFAULT_THEME } from "@timeup/core";
import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

const now = new Date();
const YEAR = now.getUTCFullYear();
const MONTH = now.getUTCMonth() + 1;
const TODAY = now.getUTCDate();

const DEMO = {
  masterEmail: "master@timeup.app",
  masterPassword: "master123",
  adminEmail: "admin@lojademo.com",
  adminPassword: "admin123",
  colabEmail: "oziel@lojademo.com",
  colabPassword: "colab123",
};

/** Colaboradores: targets per tier (Normal/Média/Agressiva) and a realized fraction of Média. */
const COLABS = [
  { name: "Oziel Santos", vendedor: "101", normal: 60000, media: 80000, agressiva: 100000, frac: 0.82, login: true },
  { name: "Marina Costa", vendedor: "102", normal: 50000, media: 70000, agressiva: 90000, frac: 1.05, login: false },
  { name: "Renato Lima", vendedor: "103", normal: 40000, media: 55000, agressiva: 70000, frac: 0.61, login: false },
  { name: "Patrícia Alves", vendedor: "104", normal: 45000, media: 60000, agressiva: 80000, frac: 0.93, login: false },
  // intentionally NOT linked to a Softcom vendedor — exercises the "não sincronizado" path
  { name: "Diego Fernandes", vendedor: null, normal: 35000, media: 50000, agressiva: 65000, frac: 0.4, login: false },
] as const;

async function main() {
  console.log(`Seeding TimeUp — período ${MONTH}/${YEAR}`);

  // ---- Master ----
  const masterHash = await hash(DEMO.masterPassword);
  const master = await prisma.user.upsert({
    where: { email: DEMO.masterEmail },
    update: { passwordHash: masterHash, isActive: true },
    create: {
      email: DEMO.masterEmail,
      passwordHash: masterHash,
      name: "Administrador Master",
      role: "master",
      tenantId: null,
    },
  });

  // ---- Tenant ----
  const tenant = await prisma.tenant.upsert({
    where: { slug: "loja-demo" },
    update: { theme: DEFAULT_THEME as unknown as object },
    create: {
      name: "Loja Demo",
      slug: "loja-demo",
      status: "active",
      theme: DEFAULT_THEME as unknown as object,
      settings: { showRealizedBrlToColaborador: false, timezone: "America/Sao_Paulo", currency: "BRL" },
      createdById: master.id,
    },
  });

  // ---- Meta tiers ----
  const tierDefs = [
    { name: "Normal", orderIndex: 1, color: "#64748b" },
    { name: "Média", orderIndex: 2, color: "#2563eb" },
    { name: "Agressiva", orderIndex: 3, color: "#059669" },
  ];
  const tiers: Record<string, string> = {};
  for (const t of tierDefs) {
    const existing = await prisma.metaTier.findFirst({ where: { tenantId: tenant.id, name: t.name } });
    const row = existing
      ? await prisma.metaTier.update({ where: { id: existing.id }, data: { orderIndex: t.orderIndex, color: t.color } })
      : await prisma.metaTier.create({ data: { ...t, tenantId: tenant.id } });
    tiers[t.name] = row.id;
  }

  // ---- Admin user ----
  const adminHash = await hash(DEMO.adminPassword);
  await prisma.user.upsert({
    where: { email: DEMO.adminEmail },
    update: { passwordHash: adminHash, isActive: true, tenantId: tenant.id, role: "admin" },
    create: {
      email: DEMO.adminEmail,
      passwordHash: adminHash,
      name: "Gestor da Loja",
      role: "admin",
      tenantId: tenant.id,
    },
  });

  // ---- Store goal ----
  const storeTarget = COLABS.reduce((s, c) => s + c.media, 0);
  await prisma.monthlyStoreGoal.upsert({
    where: { tenantId_periodYear_periodMonth: { tenantId: tenant.id, periodYear: YEAR, periodMonth: MONTH } },
    update: { targetBrl: storeTarget },
    create: { tenantId: tenant.id, periodYear: YEAR, periodMonth: MONTH, targetBrl: storeTarget, createdById: master.id },
  });

  // ---- Month settings (release ranking for the demo) ----
  await prisma.monthSettings.upsert({
    where: { tenantId_periodYear_periodMonth: { tenantId: tenant.id, periodYear: YEAR, periodMonth: MONTH } },
    update: { rankingReleasedToColaborador: true },
    create: { tenantId: tenant.id, periodYear: YEAR, periodMonth: MONTH, rankingReleasedToColaborador: true },
  });

  // ---- Colaboradores + goals + sales fixtures ----
  for (const c of COLABS) {
    const existing = await prisma.colaborador.findFirst({ where: { tenantId: tenant.id, name: c.name } });
    const colab = existing
      ? await prisma.colaborador.update({
          where: { id: existing.id },
          data: { softcomVendedorId: c.vendedor, softcomVendedorNome: c.vendedor ? c.name : null, active: true },
        })
      : await prisma.colaborador.create({
          data: {
            tenantId: tenant.id,
            name: c.name,
            softcomVendedorId: c.vendedor,
            softcomVendedorNome: c.vendedor ? c.name : null,
          },
        });

    // goals per tier
    const tierTargets: [string, number][] = [
      [tiers["Normal"]!, c.normal],
      [tiers["Média"]!, c.media],
      [tiers["Agressiva"]!, c.agressiva],
    ];
    for (const [metaTierId, targetBrl] of tierTargets) {
      await prisma.colaboradorGoal.upsert({
        where: {
          tenantId_colaboradorId_metaTierId_periodYear_periodMonth: {
            tenantId: tenant.id,
            colaboradorId: colab.id,
            metaTierId,
            periodYear: YEAR,
            periodMonth: MONTH,
          },
        },
        update: { targetBrl },
        create: { tenantId: tenant.id, colaboradorId: colab.id, metaTierId, periodYear: YEAR, periodMonth: MONTH, targetBrl },
      });
    }

    // realized = frac * média, distributed across days 1..TODAY
    const realizedTotal = Math.round(c.media * c.frac);
    let accumulated = 0;
    for (let day = 1; day <= TODAY; day++) {
      // gentle daily curve, slightly heavier mid-month
      const weight = 0.6 + 0.8 * Math.sin((Math.PI * day) / (TODAY + 1));
      const portion = Math.round((realizedTotal / TODAY) * weight);
      const value = day === TODAY ? Math.max(0, realizedTotal - accumulated) : portion;
      accumulated += value;
      const saleDate = new Date(Date.UTC(YEAR, MONTH - 1, day));
      await prisma.salesDaily.upsert({
        where: { tenantId_colaboradorId_saleDate: { tenantId: tenant.id, colaboradorId: colab.id, saleDate } },
        update: { realizedBrl: value, saleCount: Math.max(1, Math.round(value / 800)), source: "seed" },
        create: {
          tenantId: tenant.id,
          colaboradorId: colab.id,
          saleDate,
          realizedBrl: value,
          saleCount: Math.max(1, Math.round(value / 800)),
          source: "seed",
        },
      });
    }

    await prisma.salesMonthly.upsert({
      where: {
        tenantId_colaboradorId_periodYear_periodMonth: {
          tenantId: tenant.id,
          colaboradorId: colab.id,
          periodYear: YEAR,
          periodMonth: MONTH,
        },
      },
      update: { realizedBrl: realizedTotal },
      create: { tenantId: tenant.id, colaboradorId: colab.id, periodYear: YEAR, periodMonth: MONTH, realizedBrl: realizedTotal },
    });

    // colaborador login (only Oziel)
    if (c.login) {
      const colabHash = await hash(DEMO.colabPassword);
      await prisma.user.upsert({
        where: { email: DEMO.colabEmail },
        update: { passwordHash: colabHash, isActive: true, tenantId: tenant.id, role: "colaborador", colaboradorId: colab.id },
        create: {
          email: DEMO.colabEmail,
          passwordHash: colabHash,
          name: c.name,
          role: "colaborador",
          tenantId: tenant.id,
          colaboradorId: colab.id,
        },
      });
    }
  }

  // ---- Rank positions (by realized desc) ----
  const monthly = await prisma.salesMonthly.findMany({
    where: { tenantId: tenant.id, periodYear: YEAR, periodMonth: MONTH },
    orderBy: { realizedBrl: "desc" },
  });
  let pos = 1;
  for (const m of monthly) {
    await prisma.salesMonthly.update({ where: { id: m.id }, data: { rankPosition: pos++ } });
  }

  // ---- Store monthly realized ----
  const storeRealized = monthly.reduce((s, m) => s + Number(m.realizedBrl), 0);
  await prisma.storeMonthly.upsert({
    where: { tenantId_periodYear_periodMonth: { tenantId: tenant.id, periodYear: YEAR, periodMonth: MONTH } },
    update: { realizedBrl: storeRealized, budgetBrl: storeTarget },
    create: { tenantId: tenant.id, periodYear: YEAR, periodMonth: MONTH, realizedBrl: storeRealized, budgetBrl: storeTarget },
  });

  console.log("\nSeed concluído. Logins de desenvolvimento:");
  console.table([
    { papel: "master", email: DEMO.masterEmail, senha: DEMO.masterPassword },
    { papel: "admin", email: DEMO.adminEmail, senha: DEMO.adminPassword },
    { papel: "colaborador", email: DEMO.colabEmail, senha: DEMO.colabPassword },
  ]);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
