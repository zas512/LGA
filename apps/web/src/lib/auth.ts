import { api, setAccessToken, clearTokens } from "./api";

export interface User {
  sub: string;
  email: string;
  role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "ASSOCIATE";
  firmId: string | null;
}

export interface LoginResponse {
  success: boolean;
  user?: User | null;
  message?: string;
}

/**
 * Centralized Login Action
 * Calls Next.js API /api/auth/login or NestJS /auth/login, sets tokens, updates Axios
 */
export async function login(credentials: { email: string; password: string }): Promise<User> {
  console.log("[Centralized Auth] 🔑 Authenticating via Axios:", credentials.email);
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to sign in");
  }

  if (data.user) {
    console.log("[Centralized Auth] ✅ User logged in successfully:", data.user);
  }

  return data.user;
}

/**
 * Centralized Logout Action
 * Calls logout API, clears Axios tokens, and redirects to /login
 */
export async function logout(): Promise<void> {
  console.log("[Centralized Auth] 🚪 Logging out...");
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("[Centralized Auth] Error during logout API call:", err);
  } finally {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

/**
 * Centralized Auth Check / Current User Reader
 * Checks if current user session is valid via /api/auth/me
 */
export async function checkAuth(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}
