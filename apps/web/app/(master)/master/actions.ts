"use server";

import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import { masterDb } from "@timeup/db";
import {
  createTenantSchema,
  updateTenantSchema,
  themeSchema,
  normalizeTheme,
  type CreateTenantInput,
  type ThemeInput,
} from "@timeup/core";
import { parseDeviceUrl } from "@timeup/softcom";
import { assertMaster } from "@/lib/authz";
import { writeAudit } from "@/lib/audit";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function createTenant(input: CreateTenantInput): Promise<ActionResult> {
  const master = await assertMaster();
  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;
  const adminEmail = data.adminEmail.toLowerCase();

  const [slugTaken, emailTaken] = await Promise.all([
    masterDb.tenant.findUnique({ where: { slug: data.slug }, select: { id: true } }),
    masterDb.user.findUnique({ where: { email: adminEmail }, select: { id: true } }),
  ]);
  if (slugTaken) return { ok: false, error: "Este identificador (slug) já está em uso." };
  if (emailTaken) return { ok: false, error: "Já existe um usuário com este e-mail." };

  const theme = normalizeTheme(data.theme);
  const adminHash = await hash(data.adminPassword);

  const tenant = await masterDb.$transaction(async (tx) => {
    const t = await tx.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: "active",
        theme: theme as unknown as object,
        settings: { showRealizedBrlToColaborador: false, timezone: "America/Sao_Paulo", currency: "BRL" },
        createdById: master.userId,
      },
    });
    await tx.metaTier.createMany({
      data: [
        { tenantId: t.id, name: "Normal", orderIndex: 1, color: "#64748b" },
        { tenantId: t.id, name: "Média", orderIndex: 2, color: "#2563eb" },
        { tenantId: t.id, name: "Agressiva", orderIndex: 3, color: "#059669" },
      ],
    });
    await tx.user.create({
      data: { tenantId: t.id, role: "admin", email: adminEmail, passwordHash: adminHash, name: data.adminName },
    });
    // Optional: parse a pasted device/add URL and store the non-secret config.
    // Actual provisioning (which generates client_secret) happens in M4.
    if (data.softcomDeviceUrl && data.softcomDeviceUrl.trim()) {
      try {
        const p = parseDeviceUrl(data.softcomDeviceUrl);
        await tx.tenantSoftcomConfig.create({
          data: {
            tenantId: t.id,
            urlBase: p.urlBase,
            instance: p.instance,
            accountClientId: p.clientId,
            deviceName: p.deviceName,
            enabled: false,
          },
        });
      } catch {
        // ignore invalid URL at creation; can be configured later in Integração (M4)
      }
    }
    return t;
  });

  await writeAudit(tenant.id, master.userId, "create", "tenant", tenant.id, { name: data.name, slug: data.slug });
  revalidatePath("/master/empresas");
  revalidatePath("/master");
  return { ok: true, id: tenant.id };
}

export async function updateTenant(id: string, input: { name: string; status: "active" | "suspended" }): Promise<ActionResult> {
  await assertMaster();
  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  await masterDb.tenant.update({ where: { id }, data: { name: parsed.data.name, status: parsed.data.status } });
  revalidatePath("/master/empresas");
  revalidatePath(`/master/empresas/${id}`);
  return { ok: true, id };
}

export async function updateTenantTheme(id: string, theme: ThemeInput): Promise<ActionResult> {
  await assertMaster();
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { ok: false, error: "Tema inválido." };
  await masterDb.tenant.update({ where: { id }, data: { theme: normalizeTheme(parsed.data) as unknown as object } });
  revalidatePath(`/master/empresas/${id}`);
  return { ok: true, id };
}
