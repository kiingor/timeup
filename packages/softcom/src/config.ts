import { decryptSecret } from "./crypto";
import type { SoftcomClientConfig } from "./client";

export interface SoftcomConfigRow {
  urlBase: string;
  clientId: string | null;
  clientSecretEnc: Uint8Array | null;
  clientSecretIv: Uint8Array | null;
  clientSecretTag: Uint8Array | null;
  enabled: boolean;
}

/** Build a usable client config from a stored tenant_softcom_config row (decrypts secret). */
export function clientConfigFromRow(row: SoftcomConfigRow | null | undefined): SoftcomClientConfig | null {
  if (!row || !row.clientId || !row.clientSecretEnc || !row.clientSecretIv || !row.clientSecretTag) return null;
  const secret = decryptSecret({
    enc: Buffer.from(row.clientSecretEnc),
    iv: Buffer.from(row.clientSecretIv),
    tag: Buffer.from(row.clientSecretTag),
  });
  return { urlBase: row.urlBase, clientId: row.clientId, clientSecret: secret };
}
