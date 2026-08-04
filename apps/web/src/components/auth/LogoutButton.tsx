"use client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  async function handleLogout() {
    setIsLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="gap-2 text-xs font-medium"
    >
      <LogOut className="h-3.5 w-3.5" />
      {isLoading ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}
