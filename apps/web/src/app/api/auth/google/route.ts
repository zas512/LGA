import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-api";

/**
 * Kicks off Google OAuth. Forwards any `?invite=` token (used on the register
 * page) and hands the browser over to Google's consent screen.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const invite = url.searchParams.get("invite");
    const query = invite ? `?invite=${encodeURIComponent(invite)}` : "";

    const res = await fetch(getBackendUrl(`/auth/google${query}`), {
      redirect: "manual",
      cache: "no-store"
    });

    const location = res.headers.get("location");
    if (!location) {
      return NextResponse.json(
        { message: "Google sign-in is not configured" },
        { status: 503 }
      );
    }
    return NextResponse.redirect(location);
  } catch (err) {
    console.error("GET /api/auth/google error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
