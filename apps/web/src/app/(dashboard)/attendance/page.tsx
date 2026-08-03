"use client";
import {
  AttendanceRecord,
  useAttendance
} from "@/components/attendance/AttendanceContext";
import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomTable, type ColumnConfig } from "@/components/ui/table";
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit2,
  Play,
  Plus,
  Square,
  Trash2,
  TrendingUp,
  UserCheck
} from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const AddDialog = dynamic(() => import("@/components/attendance/AddDialog"), {
  ssr: false
});
const EditDialog = dynamic(() => import("@/components/attendance/EditDialog"), {
  ssr: false
});

export default function AttendancePage() {
  const {
    history,
    isCheckedIn,
    currentRecord,
    checkIn,
    checkOut,
    deleteRecord
  } = useAttendance();

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null
  );

  // Filter States
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(5);

  const filteredHistory = useMemo(() => {
    return history.filter((rec) => {
      const recDate = new Date(rec.date + "T00:00:00");
      const recMonth = recDate.getMonth() + 1; // 1-12
      const recYear = recDate.getFullYear();

      // 1. Month filter
      if (filterMonth !== "all" && recMonth !== Number(filterMonth)) {
        return false;
      }

      // 2. Year filter
      if (filterYear !== "all" && recYear !== Number(filterYear)) {
        return false;
      }

      // 3. Start date filter
      if (startDate) {
        const start = new Date(startDate + "T00:00:00");
        if (recDate < start) return false;
      }

      // 4. End date filter
      if (endDate) {
        const end = new Date(endDate + "T00:00:00");
        if (recDate > end) return false;
      }

      return true;
    });
  }, [history, filterMonth, filterYear, startDate, endDate]);

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setIsEditOpen(true);
  };

  // --- STATS COMPUTATIONS ---
  const stats = useMemo(() => {
    const completedShifts = filteredHistory.filter((r) => r.checkOut !== null);

    // 1. Total hours
    let totalMs = 0;
    completedShifts.forEach((r) => {
      if (r.checkOut) {
        totalMs +=
          new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
      }
    });
    const totalHours = totalMs / (1000 * 60 * 60);

    // 2. Present days count
    const presentCount = filteredHistory.filter(
      (r) => r.status === "PRESENT" || r.status === "HALF_DAY"
    ).length;

    // 3. Average duration
    const avgDuration =
      completedShifts.length > 0 ? totalHours / completedShifts.length : 0;

    return {
      totalHours: totalHours.toFixed(1),
      presentCount,
      avgDuration: avgDuration.toFixed(1),
      totalCompleted: completedShifts.length
    };
  }, [filteredHistory]);

  // Formatting helpers
  const formatDateFriendly = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTimeFriendly = (isoStr: string | null) => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const getDurationString = (
    checkInIso: string,
    checkOutIso: string | null
  ) => {
    if (!checkOutIso) return "In Progress";
    const diffMs =
      new Date(checkOutIso).getTime() - new Date(checkInIso).getTime();
    const totalMins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Status style helper
  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "PRESENT":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            Present
          </Badge>
        );
      case "HALF_DAY":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            Half Day
          </Badge>
        );
      case "ABSENT":
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/25">
            Absent
          </Badge>
        );
      case "LEAVE":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
            On Leave
          </Badge>
        );
    }
  };

  // Source style helper
  const getSourceBadge = (source: AttendanceRecord["source"]) => {
    switch (source) {
      case "BIOMETRIC_IMPORT":
        return (
          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
            Biometric Sync
          </span>
        );
      case "REMOTE_CHECKIN":
        return (
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
            Web Portal
          </span>
        );
      case "MANUAL":
        return (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
            Manual Log
          </span>
        );
    }
  };

  const columns: ColumnConfig<AttendanceRecord>[] = [
    {
      key: "date",
      header: "Date",
      width: "18%",
      sortable: true,
      accessor: (r) => r.date,
      render: (r) => formatDateFriendly(r.date)
    },
    {
      key: "status",
      header: "Status",
      width: "12%",
      sortable: true,
      accessor: (r) => r.status,
      render: (r) => getStatusBadge(r.status)
    },
    {
      key: "checkIn",
      header: "Check In",
      width: "12%",
      render: (r) => (
        <span className="font-mono text-xs text-foreground">
          {formatTimeFriendly(r.checkIn)}
        </span>
      )
    },
    {
      key: "checkOut",
      header: "Check Out",
      width: "12%",
      render: (r) => (
        <span className="font-mono text-xs text-foreground">
          {formatTimeFriendly(r.checkOut)}
        </span>
      )
    },
    {
      key: "duration",
      header: "Duration",
      width: "12%",
      render: (r) => (
        <span className="font-semibold text-xs text-foreground">
          {getDurationString(r.checkIn, r.checkOut)}
        </span>
      )
    },
    {
      key: "source",
      header: "Source",
      width: "14%",
      sortable: true,
      accessor: (r) => r.source,
      render: (r) => getSourceBadge(r.source)
    },
    {
      key: "notes",
      header: "Notes",
      width: "12%",
      render: (r) => (
        <span
          className="text-xs text-muted-foreground truncate max-w-50 block"
          title={r.notes}
        >
          {r.notes || "-"}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "8%",
      align: "right",
      render: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
            title="Edit Record"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete this attendance record?"
                )
              ) {
                deleteRecord(r.id);
              }
            }}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <HeaderUpdater
        title="Attendance Tracking & Leaves"
        breadcrumb="Attendance & Logs"
      />
      {/* Top dashboard section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Shift Card */}
        <Card className="md:col-span-1 border-border bg-card shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${isCheckedIn ? "bg-amber-500" : "bg-emerald-500"}`}
          />
          <CardHeader className="pt-5 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Active Clock Status</span>
              {isCheckedIn ? (
                <span className="text-[10px] text-amber-500 border border-amber-500/25 bg-amber-500/5 px-2 py-0.5 rounded-full lowercase font-bold font-mono">
                  On Duty
                </span>
              ) : (
                <span className="text-[10px] text-emerald-500 border border-emerald-500/25 bg-emerald-500/5 px-2 py-0.5 rounded-full lowercase font-bold font-mono">
                  Off Duty
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-between pt-0 pb-5">
            <div>
              {isCheckedIn && currentRecord ? (
                <div className="space-y-2 mt-2">
                  <div className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>ON DUTY</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold">
                    Shift started at:{" "}
                    <span className="text-foreground font-bold font-mono">
                      {formatTimeFriendly(currentRecord.checkIn)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <div className="text-2xl font-black text-muted-foreground tracking-tight flex items-center gap-2">
                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-muted" />
                    <span>OFF DUTY</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    Ready to start your shift? Clock in to log your working
                    hours.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              {isCheckedIn ? (
                <Button
                  onClick={() => checkOut()}
                  variant="destructive"
                  className="w-full rounded-xl py-5 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Check Out & Finish Shift
                </Button>
              ) : (
                <Button
                  onClick={() => checkIn()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-5 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Clock In & Start Shift
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Metrics Cards */}
        <div className="md:col-span-2 grid gap-4 grid-cols-2">
          {/* Card 1: Hours worked */}
          <Card className="border border-border bg-card shadow-xs relative overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Working Hours Logged</span>
                <Clock className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-3xl font-black text-foreground tracking-tight">
                {stats.totalHours} hrs
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                Accumulated across {stats.totalCompleted} completed shifts
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Attendance Rate / Present count */}
          <Card className="border border-border bg-card shadow-xs relative overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Days Accounted</span>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-3xl font-black text-foreground tracking-tight">
                {stats.presentCount} days
              </div>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1">
                Active in-office or remote logs
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Avg shift duration */}
          <Card className="border border-border bg-card shadow-xs relative overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Avg. Shift Duration</span>
                <TrendingUp className="h-4 w-4 text-teal-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-3xl font-black text-foreground tracking-tight">
                {stats.avgDuration} hrs
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                Standard shift target: 8.0 hrs
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Action Card */}
          <Card className="border border-primary/20 bg-primary/5 shadow-xs flex flex-col justify-between items-start p-5 rounded-2xl">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-foreground">
                Missed checking in?
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Log attendance manually for past shifts or offsite assignments.
              </p>
            </div>
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="mt-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Record Manually
            </Button>
          </Card>
        </div>
      </div>

      {/* History Log Section */}
      <Card className="border-border bg-card shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4 px-6">
          <CardTitle className="text-sm font-extrabold tracking-tight flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Attendance History Log
          </CardTitle>
          <div className="text-xs text-muted-foreground font-semibold">
            {filteredHistory.length !== history.length
              ? `Filtered: ${filteredHistory.length} of ${history.length} records`
              : `${history.length} total records`}
          </div>
        </CardHeader>

        {/* Filter controls bar */}
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex flex-wrap gap-4 items-end">
          {/* Month Selector */}
          <div className="space-y-1.5 min-w-32.5">
            <Label
              htmlFor="filter-month"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Month
            </Label>
            <select
              id="filter-month"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
              }}
              className="w-full h-8 text-xs bg-card border border-border rounded-lg px-2 focus:ring-1 focus:ring-primary/40 focus:outline-hidden"
            >
              <option value="all">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Year Selector */}
          <div className="space-y-1.5 min-w-25">
            <Label
              htmlFor="filter-year"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Year
            </Label>
            <select
              id="filter-year"
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
              }}
              className="w-full h-8 text-xs bg-card border border-border rounded-lg px-2 focus:ring-1 focus:ring-primary/40 focus:outline-hidden"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5 min-w-30">
            <Label
              htmlFor="filter-start-date"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Start Date
            </Label>
            <Input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
              }}
              className="h-8 text-xs bg-card border-border rounded-lg text-foreground"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5 min-w-30">
            <Label
              htmlFor="filter-end-date"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              End Date
            </Label>
            <Input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
              }}
              className="h-8 text-xs bg-card border-border rounded-lg text-foreground"
            />
          </div>

          {/* Clear Filters Button */}
          {(filterMonth !== "all" ||
            filterYear !== "all" ||
            startDate ||
            endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterMonth("all");
                setFilterYear("all");
                setStartDate("");
                setEndDate("");
              }}
              className="h-8 text-xs rounded-lg px-3 hover:bg-muted font-bold cursor-pointer"
            >
              Clear
            </Button>
          )}

          {/* Page Size Selector */}
          <div className="ml-auto space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-right">
              Show
            </Label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 text-xs bg-card border border-border rounded-lg px-2 focus:ring-1 focus:ring-primary/40 focus:outline-hidden"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          <CustomTable
            columns={columns}
            data={filteredHistory}
            rowKey={(r) => r.id}
            emptyIcon={
              <AlertCircle className="h-12 w-12 text-muted-foreground/60 mx-auto" />
            }
            emptyTitle="No matching attendance records found."
            emptyDescription="Log a new shift or adjust your date filters."
            pageSize={pageSize}
          />
        </CardContent>
      </Card>

      {/* --- ADD DIALOG --- */}
      <AddDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      {/* --- EDIT DIALOG --- */}
      <EditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        record={editingRecord}
      />
    </div>
  );
}
