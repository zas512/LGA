import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server-api";

export async function GET() {
  try {
    console.log("[WEB GET /api/firms] Calling backendFetch('/firms')");
    const res = await backendFetch("/firms");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch firms" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/firms error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[WEB POST /api/firms] Creating firm with body:", body);
    const res = await backendFetch("/firms", {
      method: "POST",
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to create firm" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/firms error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
