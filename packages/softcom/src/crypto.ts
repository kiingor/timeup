import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM encryption for secrets at rest (Softcom client_secret). The key comes
 * from MASTER_ENCRYPTION_KEY (32 bytes, base64) and never touches the database.
 */
const ALGO = "aes-256-gcm";

export interface EncryptedSecret {
  enc: Buffer;
  iv: Buffer;
  tag: Buffer;
}

function getKey(): Buffer {
  const raw = process.env.MASTER_ENCRYPTION_KEY;
  if (!raw) throw new Error("MASTER_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`MASTER_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length})`);
  }
  return key;
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { enc, iv, tag };
}

export function decryptSecret(secret: EncryptedSecret): string {
  const decipher = createDecipheriv(ALGO, getKey(), secret.iv);
  decipher.setAuthTag(secret.tag);
  const dec = Buffer.concat([decipher.update(secret.enc), decipher.final()]);
  return dec.toString("utf8");
}
