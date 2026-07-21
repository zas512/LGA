"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, login as authLogin, logout as authLogout, checkAuth } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROTECTED_PATHS = [
  "/dashboard",
  "/associates",
  "/expenses",
  "/attendance",
  "/platform"
];

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      console.log("[AuthProvider] 🔍 App started. Checking for active tokens & session...");
      try {
        const activeUser = await checkAuth();

        if (!isMounted) return;

        if (activeUser) {
          console.log("[AuthProvider] ✅ Token found! Authenticated user:", activeUser.email, `(${activeUser.role})`);
          setUser(activeUser);

          // If on login page while authenticated, route to appropriate page
          if (pathname === "/login") {
            const targetPath = activeUser.role === "SUPER_ADMIN" ? "/platform" : "/dashboard";
            console.log(`[AuthProvider] 🔀 Authenticated user on login page. Routing to ${targetPath}`);
            router.replace(targetPath);
          } else if (pathname.startsWith("/platform") && activeUser.role !== "SUPER_ADMIN") {
            console.log("[AuthProvider] ⛔ Non-SuperAdmin on platform area. Routing to /dashboard");
            router.replace("/dashboard");
          }
        } else {
          console.log("[AuthProvider] ⚠️ No active token/session found.");
          setUser(null);

          const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
          if (isProtected) {
            console.log(`[AuthProvider] 🔒 Protected route (${pathname}) accessed without auth. Redirecting to /login`);
            router.replace("/login");
          }
        }
      } catch (err) {
        console.error("[AuthProvider] Auth initialization error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const loggedUser = await authLogin(credentials);
      setUser(loggedUser);
      const destination = loggedUser.role === "SUPER_ADMIN" ? "/platform" : "/dashboard";
      console.log(`[AuthProvider] 🚀 Login succeeded! Routing to: ${destination}`);
      router.push(destination);
      router.refresh();
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setUser(null);
    await authLogout();
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login: handleLogin,
      logout: handleLogout
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
