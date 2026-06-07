import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { masterDb } from "@timeup/db";
import { loginSchema } from "@timeup/core";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();

        const user = await masterDb.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const ok = await verify(user.passwordHash, parsed.data.password);
        if (!ok) return null;

        await masterDb.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          colaboradorId: user.colaboradorId,
        };
      },
    }),
  ],
});
