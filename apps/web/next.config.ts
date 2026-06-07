import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // react-three-fiber's WebGL context doesn't survive StrictMode's double-mount in dev
  // (the canvas gets disposed + the GL context is lost). Production is unaffected either way.
  reactStrictMode: false,
  // Workspace packages are shipped as TS source and transpiled by Next.
  transpilePackages: ["@timeup/core", "@timeup/db", "@timeup/softcom"],
  // argon2 / prisma are native; keep them external to the server bundle.
  serverExternalPackages: ["@node-rs/argon2", "@prisma/client"],
  // Monorepo: trace from the repo root so the Prisma query engine (a .node binary loaded
  // dynamically, which @vercel/nft doesn't auto-detect) gets copied into the function.
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  outputFileTracingIncludes: {
    "/**/*": [
      "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/prisma*/node_modules/.prisma/client/**/*",
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
