"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // ISO String
  checkOut: string | null; // ISO String or null
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
  source: "MANUAL" | "BIOMETRIC_IMPORT" | "REMOTE_CHECKIN";
  notes?: string;
}

interface AttendanceContextType {
  history: AttendanceRecord[];
  isCheckedIn: boolean;
  currentRecord: AttendanceRecord | null;
  isLoading: boolean;
  checkIn: (notes?: string) => Promise<void>;
  checkOut: (notes?: string) => Promise<void>;
  addManualRecord: (
    date: string,
    checkInTime: string, // "HH:MM"
    checkOutTime: string, // "HH:MM"
    status: AttendanceRecord["status"],
    notes?: string
  ) => Promise<void>;
  updateRecord: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with user session status initially
  useEffect(() => {
    if (user) {
      setIsCheckedIn(user.isCheckedIn || false);
    } else {
      setIsCheckedIn(false);
    }
  }, [user]);

  // Fetch all history from DB
  const fetchHistory = useCallback(async () => {
    if (!user || user.role === "SUPER_ADMIN") {
      setHistory([]);
      setCurrentRecord(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log("[AttendanceContext] 🔄 Fetching attendance from /api/attendance");
      const res = await fetch("/api/attendance");
      if (!res.ok) {
        throw new Error("Failed to load attendance records");
      }
      const data: AttendanceRecord[] = await res.json();
      
      // Clean dates to local YYYY-MM-DD for consistency
      const formatted = data.map((rec) => {
        // Date from backend might be full ISO, we only want the date portion
        const dateStr = new Date(rec.date).toISOString().split('T')[0];
        return {
          ...rec,
          date: dateStr
        };
      });

      setHistory(formatted);

      // Find active record (checkOut is null)
      const active = formatted.find((r) => r.checkOut === null);
      setCurrentRecord(active || null);
      setIsCheckedIn(active !== null);
    } catch (err) {
      console.error("Failed to load attendance logs:", err);
      toast.error("Error loading attendance history");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load history on mount or user change
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Check In
  const checkIn = async (notes?: string) => {
    if (currentRecord) {
      toast.error("You are already checked in!");
      return;
    }

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to check in");
      }

      toast.success("Checked in successfully!");
      setIsCheckedIn(true);
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Check-in failed");
    }
  };

  // Check Out
  const checkOut = async (notes?: string) => {
    if (!currentRecord) {
      toast.error("You are not checked in!");
      return;
    }

    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to check out");
      }

      toast.success("Checked out successfully!");
      setIsCheckedIn(false);
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Check-out failed");
    }
  };

  // Add Manual Record (Past Dates)
  const addManualRecord = async (
    date: string,
    checkInTime: string, // "HH:MM"
    checkOutTime: string, // "HH:MM"
    status: AttendanceRecord["status"],
    notes?: string
  ) => {
    try {
      // Construct date object
      const [inH, inM] = checkInTime.split(":").map(Number);
      const [outH, outM] = checkOutTime.split(":").map(Number);

      const checkInDate = new Date(date + "T00:00:00");
      checkInDate.setHours(inH, inM, 0, 0);

      const checkOutDate = new Date(date + "T00:00:00");
      checkOutDate.setHours(outH, outM, 0, 0);

      if (checkOutDate.getTime() < checkInDate.getTime()) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          status,
          notes
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to log manual attendance");
      }

      toast.success("Manual attendance record logged!");
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save record");
    }
  };

  // Update Record
  const updateRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update record");
      }

      toast.success("Record updated successfully!");
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update record");
    }
  };

  // Delete Record
  const deleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete record");
      }

      toast.success("Record deleted successfully!");
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete record");
    }
  };

  // isCheckedIn is now a managed state variable

  const value = useMemo(
    () => ({
      history,
      isCheckedIn,
      currentRecord,
      isLoading,
      checkIn,
      checkOut,
      addManualRecord,
      updateRecord,
      deleteRecord,
      fetchHistory
    }),
    [history, isCheckedIn, currentRecord, isLoading, fetchHistory]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
}
