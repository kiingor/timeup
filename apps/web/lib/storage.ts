import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Storage adapter (local filesystem). On the VPS this is swapped for S3/MinIO behind
 * the same interface. Files land in apps/web/public/uploads/t/<tenantId>/ and are
 * served statically by Next at /uploads/...
 */
export const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
export const MAX_LOGO_BYTES = 1_000_000;

export async function saveLogo(tenantId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const dir = join(process.cwd(), "public", "uploads", "t", tenantId);
  await mkdir(dir, { recursive: true });
  const filename = `logo-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);
  return `/uploads/t/${tenantId}/${filename}`;
}
