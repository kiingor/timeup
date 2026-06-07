import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-three-fiber's WebGL context doesn't survive StrictMode's double-mount in dev
  // (the canvas gets disposed + the GL context is lost). Production is unaffected either way.
  reactStrictMode: false,
  // Workspace packages are shipped as TS source and transpiled by Next.
  transpilePackages: ["@timeup/core", "@timeup/db", "@timeup/softcom"],
  // argon2 / prisma are native; keep them external to the server bundle.
  serverExternalPackages: ["@node-rs/argon2", "@prisma/client"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
