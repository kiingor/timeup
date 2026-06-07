import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

function homeForRole(role: string): string {
  if (role === "master") return "/master";
  if (role === "admin") return "/app";
  return "/me";
}

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const isLogin = path === "/login";

  if (!session?.user) {
    if (isLogin) return NextResponse.next();
    const url = new URL("/login", nextUrl);
    if (path !== "/") url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  const role = session.user.role;
  const home = homeForRole(role);

  // Logged-in users never see the login page or the bare root.
  if (isLogin || path === "/") {
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  const allowed =
    (role === "master" && path.startsWith("/master")) ||
    (role === "admin" && path.startsWith("/app")) ||
    (role === "colaborador" && path.startsWith("/me"));

  if (!allowed) {
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except API routes, static assets, PWA files, and uploaded files.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|models|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|glb|gltf)$).*)",
  ],
};
