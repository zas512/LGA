import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(
          (c) => "%" + ("00" + (c.codePointAt(0) ?? 0).toString(16)).slice(-2)
        )
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const hasToken = Boolean(accessToken || refreshToken);

  if (
    !hasToken &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/team") ||
      pathname.startsWith("/expenses") ||
      pathname.startsWith("/attendance") ||
      pathname.startsWith("/platform"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasToken) {
    const user = accessToken ? decodeJwt(accessToken) : null;
    if (pathname === "/login") {
      if (user?.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/platform", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (
      pathname.startsWith("/platform") &&
      user &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/team") ||
        pathname.startsWith("/expenses") ||
        pathname.startsWith("/attendance")) &&
      user?.role === "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/platform", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/team/:path*",
    "/expenses/:path*",
    "/attendance/:path*",
    "/platform/:path*"
  ]
};
