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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const response = NextResponse.next();

  if (!accessToken && refreshToken) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        accessToken = data.accessToken;
        response.cookies.set("access_token", data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60
        });
        response.cookies.set("refresh_token", data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60
        });
      }
    } catch {
      // Ignore token refresh error in edge proxy
    }
  }

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

  return response;
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
