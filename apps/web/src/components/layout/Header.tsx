"use client";
import { useAuth } from "@/components/auth/AuthProvider";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn, getErrorMessage } from "@/lib/utils";
import { RootState } from "@/redux/store";
import { openSidebar } from "@/redux/ui";
import { Bell, Menu, Play, Square } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

interface HeaderProps {
  title?: string;
  breadcrumb?: string;
  userRole?: string;
}

// Breadcrumb parent labels, keyed by the first route segment.
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Operations",
  matters: "Matters & Cases",
  associates: "Associates & Staff",
  attendance: "Attendance & Leaves",
  platform: "Platform"
};

export function Header({
  title: propTitle,
  breadcrumb: propBreadcrumb
}: Readonly<HeaderProps>) {
  const reduxHeader = useSelector((state: RootState) => state.header);
  const title = propTitle ?? reduxHeader.title;
  const breadcrumb = propBreadcrumb ?? reduxHeader.breadcrumb;
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, refreshUser } = useAuth();

  // Derive the breadcrumb parent from the active route instead of a fixed label.
  const parentLabel = SEGMENT_LABELS[pathname?.split("/")[1] ?? ""];
  const breadcrumbIsPath = breadcrumb.includes("/");

  const isCheckedIn = user?.isCheckedIn ?? false;
  const activeCheckInTime = user?.activeCheckInTime;

  // Check-out is a two-step confirm: the first tap arms it, the second within
  // 4s commits it. This stops a stray click from silently ending a shift.
  const [confirmingCheckOut, setConfirmingCheckOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const armCheckOut = () => {
    setConfirmingCheckOut(true);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(
      () => setConfirmingCheckOut(false),
      4000
    );
  };

  const checkIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const localDate = new Date();
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, "0");
      const day = String(localDate.getDate()).padStart(2, "0");
      const clientDate = `${year}-${month}-${day}`;

      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientDate })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to check in");
      }

      toast.success("Checked in successfully!");
      await refreshUser();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Check-in failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkOut = async () => {
    if (isSubmitting) return;
    if (!confirmingCheckOut) {
      armCheckOut();
      return;
    }
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setConfirmingCheckOut(false);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to check out");
      }

      toast.success("Checked out successfully!");
      await refreshUser();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Check-out failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeFriendly = (isoStr: string | null | undefined) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-6 pt-2">
      {/* Left: Mobile nav toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => dispatch(openSidebar())}
          aria-label="Open navigation menu"
          className="lg:hidden h-9 w-9 shrink-0 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-xs transition-colors cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            {!breadcrumbIsPath && parentLabel && (
              <>
                <span>{parentLabel}</span>
                <span>/</span>
              </>
            )}
            <span className="text-primary font-bold">{breadcrumb}</span>
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      {/* Center & Right: Search Bar & Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Global Search Bar — debounced navigation to /search?q=… */}
        <GlobalSearch />

        {/* Dynamic Attendance Buttons (self check-in/out for firm owner & associates) */}
        {user && (user.role === "OWNER" || user.role === "ASSOCIATE") && (
          <div className="flex items-center">
            {isCheckedIn ? (
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 shadow-xs">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-warning/10 border border-warning/20 text-warning font-mono font-bold text-xs rounded-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning inline-block" />
                  <span>In: {formatTimeFriendly(activeCheckInTime)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => checkOut()}
                  disabled={isSubmitting}
                  aria-live="polite"
                  title={
                    confirmingCheckOut
                      ? "Tap again to confirm check-out"
                      : "Check out of today's shift"
                  }
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-3 rounded-lg text-destructive-foreground font-bold text-xs transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50",
                    confirmingCheckOut
                      ? "bg-destructive ring-2 ring-destructive/40 hover:bg-destructive/90"
                      : "bg-destructive/90 hover:bg-destructive"
                  )}
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>
                    {isSubmitting
                      ? "Checking out…"
                      : confirmingCheckOut
                        ? "Confirm check out"
                        : "Check Out"}
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => checkIn()}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-success text-success-foreground hover:bg-success/90 font-bold text-xs shadow-xs transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>{isSubmitting ? "Checking in…" : "Check In"}</span>
              </button>
            )}
          </div>
        )}

        {/* Theme Switcher Button */}
        <ThemeToggle />

        {/* Notifications Icon */}
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-xs transition-colors relative cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}
