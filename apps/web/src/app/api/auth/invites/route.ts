import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server-api";

/** Creates a member invite (OWNER/ADMIN only). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch("/auth/invites", {
      method: "POST",
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("POST /api/auth/invites error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
