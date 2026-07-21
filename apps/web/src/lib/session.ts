import { cookies } from "next/headers";
import { backendFetch } from "./server-api";

export interface UserSession {
  sub: string;
  email: string;
  role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "ASSOCIATE";
  firmId: string | null;
}

export function decodeJwt(token: string): UserSession | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(
          (c) => "%" + ("00" + (c.codePointAt(0) ?? 0).toString(16)).slice(-2)
        )
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  user: UserSession | null;
  accessToken: string | null;
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value ?? null;
  const refreshToken = cookieStore.get("refresh_token")?.value ?? null;
  if (accessToken) {
    const user = decodeJwt(accessToken);
    if (user) {
      return { user, accessToken };
    }
  }
  if (refreshToken) {
    try {
      const res = await backendFetch("/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      });
      if (res.ok) {
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        const newUser = decodeJwt(data.accessToken);
        if (newUser) {
          cookieStore.set("access_token", data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60
          });
          cookieStore.set("refresh_token", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60
          });
          return { user: newUser, accessToken: data.accessToken };
        }
      }
    } catch (err) {
      console.error("Auto refresh failed in getSession:", err);
    }
  }
  return { user: null, accessToken: null };
}

export async function serverFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  return backendFetch(endpoint, options);
}
