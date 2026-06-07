import type { ParsedDeviceUrl } from "./types";

/**
 * Parse a pasted Softcom /device/add URL into its components.
 *
 * Example input:
 *   https://selfhost.softcomservices.com/NHHskh/device/add?client_id=eebcd...&empresa_name=AUTO%20GIRO&empresa_cnpj=04289791000687&device_name=Metas
 *
 * Yields:
 *   urlBase    = https://selfhost.softcomservices.com/NHHskh
 *   instance   = NHHskh
 *   clientId   = eebcd...
 *   empresaName/empresaCnpj from the query
 *   deviceName = device_name (or device_id) query param, default "Metas"
 */
export function parseDeviceUrl(input: string): ParsedDeviceUrl {
  const url = new URL(input.trim());

  const marker = "/device/add";
  const idx = url.pathname.toLowerCase().indexOf(marker);
  if (idx === -1) {
    throw new Error("URL inválida: não contém /device/add");
  }
  const basePath = url.pathname.slice(0, idx).replace(/\/+$/, "");
  const urlBase = `${url.origin}${basePath}`;
  const segments = basePath.split("/").filter(Boolean);
  const instance = segments[segments.length - 1] ?? "";

  const clientId = url.searchParams.get("client_id")?.trim() ?? "";
  if (!clientId) {
    throw new Error("URL inválida: client_id ausente");
  }
  const deviceName =
    url.searchParams.get("device_name")?.trim() || url.searchParams.get("device_id")?.trim() || "Metas";

  return {
    urlBase,
    instance,
    clientId,
    empresaName: url.searchParams.get("empresa_name"),
    empresaCnpj: url.searchParams.get("empresa_cnpj"),
    deviceName,
  };
}
