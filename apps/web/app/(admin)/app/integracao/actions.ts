"use server";

import { revalidatePath } from "next/cache";
import { masterDb } from "@timeup/db";
import {
  parseDeviceUrl,
  provisionDevice as apiProvisionDevice,
  encryptSecret,
  clientConfigFromRow,
  getFuncionarios,
  syncTenant,
  syncEmpresa,
} from "@timeup/softcom";
import { deviceProvisionSchema } from "@timeup/core";
import { assertAdmin } from "@/lib/authz";

export type ProvisionResult = { ok: true; empresa: string | null; cnpj: string | null } | { ok: false; error: string };

/**
 * Provisions a Softcom device (one device = one empresa). Creates/refreshes a connection
 * row and upserts the Empresa it is bound to, linking them. Re-provisioning the same
 * empresa refreshes its existing connection's credentials instead of orphaning it.
 */
export async function provisionDevice(deviceUrl: string): Promise<ProvisionResult> {
  const user = await assertAdmin();
  const parsed = deviceProvisionSchema.safeParse({ deviceUrl });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "URL inválida." };

  let p;
  try {
    p = parseDeviceUrl(deviceUrl);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "URL inválida." };
  }

  try {
    const device = await apiProvisionDevice(p);
    if (device.empresa_id == null) {
      return { ok: false, error: "O device não retornou a empresa (empresa_id). Verifique a string do device/add." };
    }
    const enc = encryptSecret(device.client_secret);
    const urlBase = device.resources?.url_base ?? p.urlBase;
    const connData = {
      urlBase,
      instance: p.instance,
      accountClientId: p.clientId,
      clientId: device.client_id,
      clientSecretEnc: Uint8Array.from(enc.enc),
      clientSecretIv: Uint8Array.from(enc.iv),
      clientSecretTag: Uint8Array.from(enc.tag),
      deviceId: device.device_id,
      deviceName: device.device_name ?? p.deviceName,
      provisionedAt: new Date(),
      enabled: true,
    };

    const existing = await masterDb.empresa.findUnique({
      where: { tenantId_softcomEmpresaId: { tenantId: user.tenantId, softcomEmpresaId: device.empresa_id } },
      select: { id: true, connectionId: true },
    });

    let connectionId: string;
    if (existing?.connectionId) {
      await masterDb.tenantSoftcomConfig.update({ where: { id: existing.connectionId }, data: connData });
      connectionId = existing.connectionId;
    } else {
      const conn = await masterDb.tenantSoftcomConfig.create({ data: { tenantId: user.tenantId, ...connData } });
      connectionId = conn.id;
    }

    const name = device.empresa_name ?? p.empresaName ?? "Empresa";
    const cnpj = device.empresa_cnpj ?? p.empresaCnpj ?? null;
    await masterDb.empresa.upsert({
      where: { tenantId_softcomEmpresaId: { tenantId: user.tenantId, softcomEmpresaId: device.empresa_id } },
      update: { name, cnpj, connectionId, active: true },
      create: { tenantId: user.tenantId, softcomEmpresaId: device.empresa_id, name, cnpj, connectionId, active: true },
    });

    revalidatePath("/app/integracao");
    return { ok: true, empresa: device.empresa_name ?? null, cnpj: device.empresa_cnpj ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao provisionar o device." };
  }
}

export type SyncTriggerResult = { ok: true; rows: number } | { ok: false; error: string };

/** Sync every empresa of the tenant. */
export async function triggerSync(): Promise<SyncTriggerResult> {
  const user = await assertAdmin();
  const res = await syncTenant(user.tenantId);
  revalidatePath("/app/integracao");
  revalidatePath("/app");
  revalidatePath("/app/metas");
  if (res.status === "error") return { ok: false, error: res.error ?? "Falha na sincronização." };
  return { ok: true, rows: res.rowsUpserted };
}

/** Sync a single empresa. */
export async function triggerSyncEmpresa(empresaId: string): Promise<SyncTriggerResult> {
  const user = await assertAdmin();
  const empresa = await masterDb.empresa.findFirst({
    where: { id: empresaId, tenantId: user.tenantId },
    include: { connection: true },
  });
  if (!empresa) return { ok: false, error: "Empresa não encontrada." };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await syncEmpresa(empresa as any);
  revalidatePath("/app/integracao");
  revalidatePath("/app");
  revalidatePath("/app/metas");
  if (res.status === "error") return { ok: false, error: res.error ?? "Falha na sincronização." };
  return { ok: true, rows: res.rowsUpserted };
}

export type DeleteEmpresaResult = { ok: true } | { ok: false; error: string };

/**
 * Removes an empresa and everything under it (colaboradores, their sales/metas/logins),
 * plus its now-orphaned Softcom connection. Destructive — the UI confirms first.
 */
export async function deleteEmpresa(empresaId: string): Promise<DeleteEmpresaResult> {
  let user;
  try {
    user = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não autorizado." };
  }
  const empresa = await masterDb.empresa.findFirst({
    where: { id: empresaId, tenantId: user.tenantId },
    select: { id: true, connectionId: true },
  });
  if (!empresa) return { ok: false, error: "Empresa não encontrada." };

  try {
    // remove the colaboradores' logins first (User.colaboradorId is SetNull on cascade,
    // which would otherwise orphan colaborador-role users), then the empresa (cascades
    // colaboradores + sales + metas + store rows), then its orphaned connection.
    const colabs = await masterDb.colaborador.findMany({ where: { tenantId: user.tenantId, empresaId }, select: { id: true } });
    const colabIds = colabs.map((c) => c.id);
    if (colabIds.length) {
      await masterDb.user.deleteMany({ where: { tenantId: user.tenantId, colaboradorId: { in: colabIds } } });
    }
    await masterDb.empresa.delete({ where: { id: empresaId } });
    if (empresa.connectionId) {
      const remaining = await masterDb.empresa.count({ where: { connectionId: empresa.connectionId } });
      if (remaining === 0) await masterDb.tenantSoftcomConfig.delete({ where: { id: empresa.connectionId } }).catch(() => {});
    }
    revalidatePath("/app/integracao");
    revalidatePath("/app/colaboradores");
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível remover a empresa." };
  }
}

export type VendedoresResult =
  | { ok: true; vendedores: { id: number; nome: string; email?: string | null }[] }
  | { ok: false; error: string };

/** List Softcom funcionários for a specific empresa's connection (vendedor picker). */
export async function listSoftcomVendedores(empresaId: string): Promise<VendedoresResult> {
  const user = await assertAdmin();
  if (!empresaId) return { ok: false, error: "Selecione uma empresa primeiro." };
  const empresa = await masterDb.empresa.findFirst({
    where: { id: empresaId, tenantId: user.tenantId },
    include: { connection: true },
  });
  const cfg = clientConfigFromRow(empresa?.connection ?? null);
  if (!cfg) return { ok: false, error: "Empresa sem conexão Softcom configurada." };
  try {
    const vendedores = await getFuncionarios(cfg);
    return { ok: true, vendedores: vendedores.map((v) => ({ id: v.id, nome: v.nome, email: v.email })) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao buscar vendedores." };
  }
}
