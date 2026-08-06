import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server-api";

/** Signed Cloudinary credentials for onboarding logo/avatar uploads. */
export async function GET() {
  try {
    const res = await backendFetch("/auth/uploads/signature");
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("GET /api/auth/uploads/signature error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
