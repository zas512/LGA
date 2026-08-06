import { NextResponse } from "next/server";
import { forwardBackendCookiesToResponse } from "@/lib/session";
import { getBackendUrl } from "@/lib/server-api";

/**
 * Google's redirect target. Forwards the full query string (code, state,
 * scope, authuser, prompt) to the backend, then follows the backend's
 * redirect. On the sign-in branch the backend also sets auth cookies, which
 * are forwarded onto the browser via Set-Cookie.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.search; // includes leading "?"

    const res = await fetch(getBackendUrl(`/auth/google/callback${query}`), {
      redirect: "manual",
      cache: "no-store"
    });

    const location = res.headers.get("location");
    if (!location) {
      return NextResponse.json(
        { message: "Google authentication failed" },
        { status: 502 }
      );
    }

    const response = NextResponse.redirect(location);
    forwardBackendCookiesToResponse(res, response);
    return response;
  } catch (err) {
    console.error("GET /api/auth/google/callback error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
