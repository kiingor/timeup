// Generates dev secrets and writes consistent .env files across the workspace.
// Safe to re-run: it preserves existing secret values if the files already exist.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/timeup?schema=public";

function readExisting(path, key) {
  if (!existsSync(path)) return null;
  const m = readFileSync(path, "utf8").match(new RegExp(`^${key}="?([^"\\n]+)"?`, "m"));
  return m ? m[1] : null;
}

const webEnvPath = resolve(root, "apps/web/.env.local");
const authSecret = readExisting(webEnvPath, "AUTH_SECRET") || randomBytes(32).toString("base64");
const masterKey = readExisting(webEnvPath, "MASTER_ENCRYPTION_KEY") || randomBytes(32).toString("base64");
const syncSecret = readExisting(webEnvPath, "INTERNAL_SYNC_SECRET") || randomBytes(24).toString("hex");

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log("wrote", path);
}

// Prisma CLI + worker (root + db package)
const rootEnv = `DATABASE_URL="${DB_URL}"
MASTER_ENCRYPTION_KEY="${masterKey}"
INTERNAL_SYNC_SECRET="${syncSecret}"
TZ="America/Sao_Paulo"
`;
write(resolve(root, ".env"), rootEnv);
write(resolve(root, "packages/db/.env"), `DATABASE_URL="${DB_URL}"\n`);

// Next.js web app
const webEnv = `DATABASE_URL="${DB_URL}"
AUTH_SECRET="${authSecret}"
MASTER_ENCRYPTION_KEY="${masterKey}"
INTERNAL_SYNC_SECRET="${syncSecret}"
TZ="America/Sao_Paulo"
NEXT_PUBLIC_APP_NAME="TimeUp"
SOFTCOM_MOCK="0"
`;
write(webEnvPath, webEnv);

console.log("env files ready.");
