"use client";
import { ProfileDropdown } from "@/components/layout/ProfileDropdown";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Scale,
  Users
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
  user: {
    email: string;
    role: string;
    firmId: string | null;
    name?: string | null;
  };
}

export function Sidebar({ user }: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["OWNER", "ADMIN", "ASSOCIATE", "SUPER_ADMIN"]
    },
    {
      title: "Matters & Cases",
      href: "/matters",
      icon: Scale,
      roles: ["OWNER", "ADMIN", "ASSOCIATE"]
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
      title: "Firms Management",
      href: "/platform",
      icon: Building2,
      roles: ["SUPER_ADMIN"]
    }
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  const displayName = user.name || user.email;
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };
  const userInitials = getInitials(displayName);

  return (
    <aside
      className={cn(
        "shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col justify-between min-h-screen text-sidebar-foreground relative overflow-visible transition-[width,padding] duration-200 ease-out",
        collapsed ? "w-[4.5rem] p-3" : "w-64 p-5"
      )}
    >
      {/* Floating Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={
          collapsed ? "Expand sidebar" : "Collapse sidebar"
        }
        aria-expanded={!collapsed}
        className="absolute top-4 -right-3 z-40 h-8 w-8 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer hover:scale-105 transition-all"
        title={
          collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"
        }
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Top Section */}
      <div className="space-y-6 flex flex-col">
        {/* Brand Logo & Title */}
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border h-11.25",
            collapsed
              ? "justify-center pb-6 mt-6"
              : "gap-3 mt-8 justify-between pb-12"
          )}
        >
          {collapsed ? (
            <Image
              src="/laal_icon.png"
              alt="LGA"
              width={30}
              height={30}
              className="object-contain"
            />
          ) : (
            <>
              <Image
                src="/lgt_black.png"
                alt="Laal Global Advisory"
                width={300}
                height={100}
                className="object-contain dark:hidden"
              />
              <Image
                src="/lgt_white.png"
                alt="Laal Global Advisory"
                width={300}
                height={100}
                className="object-contain hidden dark:block"
              />
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          className="space-y-1.5 pt-1"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {!collapsed && (
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-3 pb-1">
              Navigation
            </p>
          )}
          <AnimatePresence>
            {filteredNav.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onMouseEnter={() => setHoveredIndex(index)}
                  className={cn(
                    "relative flex items-center rounded-xl text-xs font-semibold outline-none transition-colors",
                    collapsed
                      ? "justify-center h-9 w-9 mx-auto"
                      : "px-3.5 py-2.5 gap-3 w-full",
                    isActive
                      ? "text-sidebar-primary-foreground font-bold shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-sidebar-foreground"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  {/* Hover background pill */}
                  {hoveredIndex === index && !isActive && (
                    <motion.div
                      layoutId="sidebar-hover-pill"
                      className={cn(
                        "absolute inset-0 bg-sidebar-accent/80",
                        collapsed ? "rounded-full" : "rounded-xl"
                      )}
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 32,
                        mass: 0.6
                      }}
                    />
                  )}
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className={cn(
                        "absolute inset-0 bg-sidebar-primary",
                        collapsed ? "rounded-full" : "rounded-xl"
                      )}
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 32,
                        mass: 0.6
                      }}
                    />
                  )}

                  <Icon
                    className={cn(
                      "h-4 w-4 relative z-10 shrink-0",
                      isActive
                        ? "text-sidebar-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      className="relative z-10 truncate"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </AnimatePresence>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-sidebar-border relative">
        <ProfileDropdown
          user={user}
          collapsed={collapsed}
          userInitials={userInitials}
          displayName={displayName}
        />
      </div>
    </aside>
  );
}
