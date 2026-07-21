import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/server-api";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (refreshToken) {
      await backendFetch("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      }).catch((err) => console.error("Logout backend call failed:", err));
    }
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout API route error:", err);
    return NextResponse.json(
      { message: "Internal server error during logout" },
      { status: 500 }
    );
  }
}
