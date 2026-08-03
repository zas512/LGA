"use client";
import { useAttendance } from "@/components/attendance/AttendanceContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Input } from "@/components/ui/input";
import { RootState } from "@/redux/store";
import { Bell, Play, Search, Square } from "lucide-react";
import { useSelector } from "react-redux";

interface HeaderProps {
  title?: string;
  breadcrumb?: string;
  userRole?: string; // Suppressed compile errors if passed
}

export function Header({
  title: propTitle,
  breadcrumb: propBreadcrumb
}: Readonly<HeaderProps>) {
  const reduxHeader = useSelector((state: RootState) => state.header);
  const title = propTitle ?? reduxHeader.title;
  const breadcrumb = propBreadcrumb ?? reduxHeader.breadcrumb;
  const { user } = useAuth();
  const { isCheckedIn, currentRecord, checkIn, checkOut } = useAttendance();

  // Helper to format check-in time statically
  const formatTimeFriendly = (isoStr: string | null | undefined) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

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
        <div className="relative w-48 md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases, associates, expenses..."
            className="pl-9 bg-card border-border text-xs rounded-xl shadow-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
          />
        </div>

        {/* Dynamic Attendance Buttons (For users belonging to firms) */}
        {user && user.role !== "SUPER_ADMIN" && (
          <div className="flex items-center">
            {isCheckedIn ? (
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 shadow-xs">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs rounded-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                  <span>In: {formatTimeFriendly(currentRecord?.checkIn)}</span>
                </div>
                <button
                  onClick={() => checkOut()}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-destructive hover:bg-destructive/95 text-destructive-foreground font-bold text-xs transition-all duration-200 cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>Check Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => checkIn()}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all duration-200 cursor-pointer"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Check In</span>
              </button>
            )}
          </div>
        )}

        {/* Theme Switcher Button */}
        <ThemeToggle />

        {/* Notifications Icon */}
        <button className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-xs transition-colors relative cursor-pointer">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}
