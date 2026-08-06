import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-api";

/** Decodes the short-lived Google profile code into { email, name, picture }. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return NextResponse.json(
        { message: "Missing code parameter" },
        { status: 400 }
      );
    }

    const res = await fetch(
      getBackendUrl(`/auth/google/profile?code=${encodeURIComponent(code)}`),
      { cache: "no-store" }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("GET /api/auth/google/profile error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
