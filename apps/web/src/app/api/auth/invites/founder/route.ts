import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server-api";

/** Creates a founder invite (SUPER_ADMIN only). Owner onboards to create their firm. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch("/auth/invites/founder", {
      method: "POST",
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("POST /api/auth/invites/founder error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
