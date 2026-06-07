import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

// Middleware normally redirects "/" by role; this is a server-side fallback.
export default async function RootPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "master") redirect("/master");
  if (user.role === "admin") redirect("/app");
  redirect("/me");
}
