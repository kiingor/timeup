import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no DB, no native modules). Shared by middleware and the
 * full Node config in auth.ts. The Credentials provider with DB lookups lives only
 * in auth.ts so it never gets bundled into the edge middleware.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId ?? null;
        token.colaboradorId = user.colaboradorId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.userId = token.sub as string;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId ?? null;
        session.user.colaboradorId = token.colaboradorId ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
