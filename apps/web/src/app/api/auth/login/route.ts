import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "@/lib/session";
import { backendFetch } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await backendFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Invalid credentials" },
        { status: res.status }
      );
    }

    const tokens = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    const user = decodeJwt(tokens.accessToken);

    const cookieStore = await cookies();
    cookieStore.set("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60
    });
    cookieStore.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Login API route error:", err);
    return NextResponse.json(
      { message: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
