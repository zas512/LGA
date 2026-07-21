import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  if (
    !accessToken &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/expenses") ||
      pathname.startsWith("/attendance") ||
      pathname.startsWith("/platform"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (accessToken) {
    const user = decodeJwt(accessToken);
    if (pathname === "/login") {
      if (user?.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/platform", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/platform") && user?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (
      (pathname.startsWith("/dashboard") ||
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
    "/expenses/:path*",
    "/attendance/:path*",
    "/platform/:path*"
  ]
};
