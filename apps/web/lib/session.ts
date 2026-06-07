import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role, SessionUser } from "@timeup/core";

function homeForRole(role: Role): string {
  if (role === "master") return "/master";
  if (role === "admin") return "/app";
  return "/me";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser) ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireMaster(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "master") redirect(homeForRole(user.role));
  return user;
}

/** Admin context — guarantees a tenantId. */
export async function requireAdmin(): Promise<SessionUser & { tenantId: string }> {
  const user = await requireUser();
  if (user.role !== "admin" || !user.tenantId) redirect(homeForRole(user.role));
  return user as SessionUser & { tenantId: string };
}

/** Colaborador context — guarantees tenantId and colaboradorId. */
export async function requireColaborador(): Promise<SessionUser & { tenantId: string; colaboradorId: string }> {
  const user = await requireUser();
  if (user.role !== "colaborador" || !user.tenantId || !user.colaboradorId) {
    redirect(homeForRole(user.role));
  }
  return user as SessionUser & { tenantId: string; colaboradorId: string };
}
