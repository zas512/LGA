import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server-api";

/** Validates an invite token for the register page intro. Public. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const res = await backendFetch(
      `/auth/invites/${encodeURIComponent(token)}`
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("GET /api/auth/invites/[token] error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
