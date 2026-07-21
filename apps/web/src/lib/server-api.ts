import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function getBackendUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export async function backendFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const targetUrl = getBackendUrl(endpoint);
  console.log(
    `[server-api:backendFetch] 🚀 ${options.method || "GET"} ${targetUrl} | Cookies -> access_token: ${accessToken ? "PRESENT (" + accessToken.slice(0, 10) + "...)" : "MISSING"}, refresh_token: ${refreshToken ? "PRESENT" : "MISSING"}`
  );

  const res = await fetch(targetUrl, {
    ...options,
    headers,
    cache: options.cache || "no-store"
  });

  console.log(`[server-api:backendFetch] 📥 Status: ${res.status} for ${targetUrl}`);
  return res;
}
