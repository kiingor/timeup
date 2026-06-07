import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Deleting tenants cascades to everything tenant-scoped (users, colaboradores,
  // tiers, goals, sales, sync runs, softcom config, audit logs with a tenant).
  const tenants = await prisma.tenant.deleteMany({});
  // Defensive: drop any non-master users / stray audit not tied to a tenant.
  const users = await prisma.user.deleteMany({ where: { role: { not: "master" } } });
  await prisma.auditLog.deleteMany({});

  const masters = await prisma.user.findMany({ where: { role: "master" }, select: { email: true, name: true } });

  console.log("Banco limpo.");
  console.log("  Tenants removidos:", tenants.count);
  console.log("  Usuários não-master removidos:", users.count);
  console.table(masters);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
