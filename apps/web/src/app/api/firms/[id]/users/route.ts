import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server-api";

/** Lists members of a firm. SUPER_ADMIN platform page. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await backendFetch(`/firms/${id}/users`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch firm members" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/firms/[id]/users error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Manually creates a user in a firm (name/email/role/initial password). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await backendFetch(`/firms/${id}/users`, {
      method: "POST",
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.ok ? 201 : res.status });
  } catch (err) {
    console.error("POST /api/firms/[id]/users error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
