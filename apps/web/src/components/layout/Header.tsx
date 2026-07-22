"use client";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface HeaderProps {
  title?: string;
  breadcrumb?: string;
}

export function Header({
  title = "Dashboard",
  breadcrumb = "Firm / Overview"
}: Readonly<HeaderProps>) {
  return (
    <header className="flex items-center justify-between gap-4 pb-6 pt-2">
      {/* Left: Breadcrumb & Title */}
      <div>
        <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
          <span>Billing & Operations</span>
          <span>/</span>
          <span className="text-primary font-bold">{breadcrumb}</span>
        </p>
        <h1 className="text-2xl font-black tracking-tight text-foreground mt-0.5">
          {title}
        </h1>
      </div>

      {/* Center & Right: Search Bar & Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative w-64 md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases, associates, expenses..."
            className="pl-9 bg-card border-border text-xs rounded-xl shadow-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
          />
        </div>

        {/* Theme Switcher Button */}
        <ThemeToggle />

        {/* Notifications Icon */}
        <button className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-xs transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}
