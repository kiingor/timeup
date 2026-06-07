import type {
  ParsedDeviceUrl,
  SoftcomDeviceData,
  SoftcomEnvelope,
  SoftcomKpi,
  SoftcomRankingVendedor,
  SoftcomVendedor,
} from "./types";

export interface SoftcomClientConfig {
  urlBase: string;
  clientId: string;
  clientSecret: string;
}

const MOCK = () => process.env.SOFTCOM_MOCK === "1";

/** Per-process token cache keyed by clientId. */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getToken(cfg: SoftcomClientConfig): Promise<string> {
  const now = Date.now();
  const cached = tokenCache.get(cfg.clientId);
  if (cached && now < cached.expiresAt - 60_000) return cached.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const res = await fetch(`${cfg.urlBase}/authentication/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Softcom auth falhou (HTTP ${res.status})`);
  const json = (await res.json()) as SoftcomEnvelope<{ token: string; expires_in: number }>;
  const token = json?.data?.token;
  if (!token) {
    // Surface Softcom's own message (e.g. "ClientID ou ConsumerSecret incorretos.")
    throw new Error(json?.human || json?.message || "Softcom não retornou token (credenciais inválidas?).");
  }
  tokenCache.set(cfg.clientId, { token, expiresAt: now + (json.data.expires_in ?? 3599) * 1000 });
  return token;
}

async function apiGet<T>(cfg: SoftcomClientConfig, path: string): Promise<SoftcomEnvelope<T>> {
  const token = await getToken(cfg);
  const res = await fetch(`${cfg.urlBase}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const json = (await res.json()) as SoftcomEnvelope<T>;
  return json;
}

/* ------------------------------- Endpoints ------------------------------- */

export async function getStatusInfo(cfg: SoftcomClientConfig): Promise<{ empresa: string; cnpj: string } | null> {
  if (MOCK()) return { empresa: "EMPRESA MOCK", cnpj: "00000000000000" };
  const token = await getToken(cfg);
  const res = await fetch(`${cfg.urlBase}/api/status/info`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return (await res.json()) as { empresa: string; cnpj: string };
}

export async function getEmpresa(cfg: SoftcomClientConfig): Promise<{ empresa_id: number; empresa_razao_social: string | null; empresa_cnpj: string } | null> {
  if (MOCK()) return { empresa_id: 1, empresa_razao_social: "EMPRESA MOCK", empresa_cnpj: "00000000000000" };
  const env = await apiGet<{ empresa_id: number; empresa_razao_social: string | null; empresa_cnpj: string }>(cfg, "/api/Empresa");
  return env.data ?? null;
}

export async function getFuncionarios(cfg: SoftcomClientConfig): Promise<SoftcomVendedor[]> {
  if (MOCK()) return mockVendedores();
  const env = await apiGet<SoftcomVendedor[]>(cfg, "/api/funcionario");
  return Array.isArray(env.data) ? env.data : [];
}

export async function getRankingVendedor(
  cfg: SoftcomClientConfig,
  ano: number,
  mes: number,
  dia?: number,
): Promise<SoftcomRankingVendedor[]> {
  if (MOCK()) return mockRanking();
  const qs = new URLSearchParams({ Ano: String(ano), Mes: String(mes) });
  if (dia) qs.set("Dia", String(dia));
  const env = await apiGet<SoftcomRankingVendedor[]>(cfg, `/api/reports/rankingvendedor?${qs}`);
  return Array.isArray(env.data) ? env.data : [];
}

export async function getKpi(cfg: SoftcomClientConfig, ano: number, mes: number): Promise<SoftcomKpi[]> {
  if (MOCK()) return [];
  const env = await apiGet<SoftcomKpi[]>(cfg, `/api/reports/kpi?Ano=${ano}&Mes=${mes}`);
  return Array.isArray(env.data) ? env.data : [];
}

/** Per-vendedor sales in a date range (for daily aggregation). */
export async function getPreVendasV1(
  cfg: SoftcomClientConfig,
  params: { vendedor_id?: number; data_inicial: string; data_final: string },
): Promise<{ valor: number; data: string; vendedor_id?: number }[]> {
  if (MOCK()) return [];
  const qs = new URLSearchParams({ "param.data_inicial": params.data_inicial, "param.data_final": params.data_final });
  if (params.vendedor_id) qs.set("param.vendedor_id", String(params.vendedor_id));
  const env = await apiGet<unknown[]>(cfg, `/api/vendas/vendas/pre-venda?${qs}`);
  // shape is tolerant — normalized by the sync layer
  return (Array.isArray(env.data) ? env.data : []) as { valor: number; data: string; vendedor_id?: number }[];
}

/* ------------------------------ Provisioning ----------------------------- */

/** POST {urlBase}/device/add to generate device credentials (client_secret + device_id). */
export async function provisionDevice(parsed: ParsedDeviceUrl): Promise<SoftcomDeviceData> {
  if (MOCK()) {
    return {
      client_id: parsed.clientId,
      client_secret: "mock-secret-" + parsed.instance,
      device_id: parsed.deviceName,
      device_name: parsed.deviceName,
      empresa_id: 1,
      empresa_name: parsed.empresaName ?? "EMPRESA MOCK",
      empresa_cnpj: parsed.empresaCnpj ?? "00000000000000",
      resources: { url_base: parsed.urlBase },
    };
  }

  // empresa is selected via query params; device id/name go in the body (matches the
  // pasted device/add URL format).
  const qs = new URLSearchParams({ client_id: parsed.clientId, device_name: parsed.deviceName });
  if (parsed.empresaName) qs.set("empresa_name", parsed.empresaName);
  if (parsed.empresaCnpj) qs.set("empresa_cnpj", parsed.empresaCnpj);
  const body = new URLSearchParams({ client_id: parsed.clientId, device_id: parsed.deviceName });

  const res = await fetch(`${parsed.urlBase}/device/add?${qs.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`device/add falhou (HTTP ${res.status})`);

  // Most instances reply flat ({code,data,...}); some wrap it ({body:{data}}). Handle both.
  const raw = (await res.json()) as
    | (SoftcomEnvelope<SoftcomDeviceData> & { body?: SoftcomEnvelope<SoftcomDeviceData> });
  const env = raw?.body ?? raw;
  const data = env?.data;
  if (!data?.client_secret) {
    const reason = env?.human || env?.message || JSON.stringify(raw).slice(0, 240);
    throw new Error(`device/add não retornou client_secret — Softcom respondeu: ${reason}`);
  }
  return data;
}

/* -------------------------------- Mocks ---------------------------------- */

function mockVendedores(): SoftcomVendedor[] {
  return [
    { id: 101, nome: "Oziel Santos", email: "oziel@mock", desativado: false },
    { id: 102, nome: "Marina Costa", email: "marina@mock", desativado: false },
    { id: 103, nome: "Renato Lima", email: "renato@mock", desativado: false },
    { id: 104, nome: "Patrícia Alves", email: "patricia@mock", desativado: false },
    { id: 105, nome: "Diego Fernandes", email: "diego@mock", desativado: false },
  ];
}

function mockRanking(): SoftcomRankingVendedor[] {
  // deterministic per-vendedor monthly totals
  return [
    { vendedor_id: 102, nome: "Marina Costa", total: 78200, posicao: 1 },
    { vendedor_id: 101, nome: "Oziel Santos", total: 69400, posicao: 2 },
    { vendedor_id: 104, nome: "Patrícia Alves", total: 58100, posicao: 3 },
    { vendedor_id: 103, nome: "Renato Lima", total: 35900, posicao: 4 },
    { vendedor_id: 105, nome: "Diego Fernandes", total: 22300, posicao: 5 },
  ];
}
