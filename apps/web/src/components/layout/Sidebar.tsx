"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Scale
} from "lucide-react";
import { LogoutButton } from "../auth/LogoutButton";

interface SidebarProps {
  user: {
    email: string;
    role: string;
    firmId: string | null;
  };
}

export function Sidebar({ user }: Readonly<SidebarProps>) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["OWNER", "ADMIN", "ASSOCIATE", "SUPER_ADMIN"]
    },
    {
      title: "Associates & Staff",
      href: "/associates",
      icon: Users,
      roles: ["OWNER", "ADMIN"]
    },
    {
      title: "Attendance & Leaves",
      href: "/attendance",
      icon: Calendar,
      roles: ["OWNER", "ADMIN", "ASSOCIATE"]
    },
    {
      title: "Expenses & Billing",
      href: "/expenses",
      icon: CreditCard,
      roles: ["OWNER", "ADMIN"]
    },
    {
      title: "Platform Admin",
      href: "/platform",
      icon: ShieldAlert,
      roles: ["SUPER_ADMIN"]
    }
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));
  const userInitials = user.email.substring(0, 2).toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col justify-between p-5 min-h-screen text-sidebar-foreground">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 pb-2 border-b border-sidebar-border">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-sidebar-foreground tracking-tight">
              Laal Global
            </h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Advisory CRM
            </p>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-xs">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-card-foreground truncate">
              {user.email}
            </p>
            <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 mt-0.5">
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 pt-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-3 pb-1">
            Navigation
          </p>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-md shadow-primary/20 translate-x-0.5"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-sidebar-primary-foreground"
                      : "text-muted-foreground"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-sidebar-border space-y-3">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-sidebar-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-[11px]">
            Law Firm Edition v1.0
          </span>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
