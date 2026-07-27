"use client";
import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAttendance, AttendanceRecord } from "@/components/attendance/AttendanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Clock,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Play,
  Square,
  AlertCircle,
  TrendingUp,
  UserCheck
} from "lucide-react";

export default function AttendancePage() {
  const { user } = useAuth();
  const {
    history,
    isCheckedIn,
    currentRecord,
    checkIn,
    checkOut,
    addManualRecord,
    updateRecord,
    deleteRecord
  } = useAttendance();

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Form states for manual additions
  const [addDate, setAddDate] = useState("");
  const [addCheckIn, setAddCheckIn] = useState("09:00");
  const [addCheckOut, setAddCheckOut] = useState("17:00");
  const [addStatus, setAddStatus] = useState<AttendanceRecord["status"]>("PRESENT");
  const [addNotes, setAddNotes] = useState("");

  // Form states for edits
  const [editDate, setEditDate] = useState("");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editStatus, setEditStatus] = useState<AttendanceRecord["status"]>("PRESENT");
  const [editNotes, setEditNotes] = useState("");

  // Filter & Pagination States
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterYear, startDate, endDate]);

  const filteredHistory = React.useMemo(() => {
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

  const paginatedHistory = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredHistory.slice(startIndex, startIndex + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;

  // Initialize add form defaults on open
  useEffect(() => {
    if (isAddOpen) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setAddDate(`${yyyy}-${mm}-${dd}`);
      setAddCheckIn("09:00");
      setAddCheckOut("17:00");
      setAddStatus("PRESENT");
      setAddNotes("");
    }
  }, [isAddOpen]);

  // Load record values when editing starts
  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditDate(rec.date);
    
    // Extract HH:MM from ISO string
    const checkInDate = new Date(rec.checkIn);
    const inH = String(checkInDate.getHours()).padStart(2, "0");
    const inM = String(checkInDate.getMinutes()).padStart(2, "0");
    setEditCheckIn(`${inH}:${inM}`);

    if (rec.checkOut) {
      const checkOutDate = new Date(rec.checkOut);
      const outH = String(checkOutDate.getHours()).padStart(2, "0");
      const outM = String(checkOutDate.getMinutes()).padStart(2, "0");
      setEditCheckOut(`${outH}:${outM}`);
    } else {
      setEditCheckOut("");
    }
    setEditStatus(rec.status);
    setEditNotes(rec.notes || "");
    setIsEditOpen(true);
  };

  // Submit manual addition
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDate || !addCheckIn || !addCheckOut) return;
    addManualRecord(addDate, addCheckIn, addCheckOut, addStatus, addNotes);
    setIsAddOpen(false);
  };

  // Submit edits
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editDate || !editCheckIn) return;

    // Construct checkIn ISO
    const [inH, inM] = editCheckIn.split(":").map(Number);
    const inDate = new Date(editDate);
    inDate.setHours(inH, inM, 0, 0);

    let outIso: string | null = null;
    if (editCheckOut) {
      const [outH, outM] = editCheckOut.split(":").map(Number);
      const outDate = new Date(editDate);
      outDate.setHours(outH, outM, 0, 0);
      if (outDate.getTime() < inDate.getTime()) {
        outDate.setDate(outDate.getDate() + 1);
      }
      outIso = outDate.toISOString();
    }

    updateRecord(editingRecord.id, {
      date: editDate,
      checkIn: inDate.toISOString(),
      checkOut: outIso,
      status: editStatus,
      notes: editNotes
    });
    
    setIsEditOpen(false);
  };

  // --- STATS COMPUTATIONS ---
  const stats = React.useMemo(() => {
    const completedShifts = filteredHistory.filter((r) => r.checkOut !== null);
    
    // 1. Total hours
    let totalMs = 0;
    completedShifts.forEach((r) => {
      if (r.checkOut) {
        totalMs += new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
      }
    });
    const totalHours = totalMs / (1000 * 60 * 60);

    // 2. Present days count
    const presentCount = filteredHistory.filter((r) => r.status === "PRESENT" || r.status === "HALF_DAY").length;

    // 3. Average duration
    const avgDuration = completedShifts.length > 0 ? totalHours / completedShifts.length : 0;

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

  const getDurationString = (checkInIso: string, checkOutIso: string | null) => {
    if (!checkOutIso) return "In Progress";
    const diffMs = new Date(checkOutIso).getTime() - new Date(checkInIso).getTime();
    const totalMins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Status style helper
  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">Present</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">Half Day</Badge>;
      case "ABSENT":
        return <Badge className="bg-destructive/10 text-destructive border border-destructive/25">Absent</Badge>;
      case "LEAVE":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">On Leave</Badge>;
    }
  };

  // Source style helper
  const getSourceBadge = (source: AttendanceRecord["source"]) => {
    switch (source) {
      case "BIOMETRIC_IMPORT":
        return <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">Biometric Sync</span>;
      case "REMOTE_CHECKIN":
        return <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">Web Portal</span>;
      case "MANUAL":
        return <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">Manual Log</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Attendance Tracking & Leaves"
        breadcrumb="Attendance & Logs"
      />

      {/* Top dashboard section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Shift Card */}
        <Card className="md:col-span-1 border-border bg-card shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isCheckedIn ? "bg-amber-500" : "bg-emerald-500"}`} />
          <CardHeader className="pt-5 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Active Clock Status</span>
              {isCheckedIn ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-500 border border-amber-500/25 bg-amber-500/5 px-2 py-0.5 rounded-full lowercase font-bold font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                  on duty
                </span>
              ) : (
                <span className="text-[10px] text-emerald-500 border border-emerald-500/25 bg-emerald-500/5 px-2 py-0.5 rounded-full lowercase font-bold font-mono">
                  off duty
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
                    Shift started at: <span className="text-foreground font-bold font-mono">{formatTimeFriendly(currentRecord.checkIn)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <div className="text-2xl font-black text-muted-foreground tracking-tight flex items-center gap-2">
                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-muted" />
                    <span>OFF DUTY</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    Ready to start your shift? Clock in to log your working hours.
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
              <h3 className="font-extrabold text-sm text-foreground">Missed checking in?</h3>
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
          <div className="space-y-1.5 min-w-[130px]">
            <Label htmlFor="filter-month" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Month</Label>
            <select
              id="filter-month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
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
          <div className="space-y-1.5 min-w-[100px]">
            <Label htmlFor="filter-year" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Year</Label>
            <select
              id="filter-year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full h-8 text-xs bg-card border border-border rounded-lg px-2 focus:ring-1 focus:ring-primary/40 focus:outline-hidden"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5 min-w-[120px]">
            <Label htmlFor="filter-start-date" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Start Date</Label>
            <Input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs bg-card border-border rounded-lg text-foreground"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5 min-w-[120px]">
            <Label htmlFor="filter-end-date" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">End Date</Label>
            <Input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs bg-card border-border rounded-lg text-foreground"
            />
          </div>

          {/* Clear Filters Button */}
          {(filterMonth !== "all" || filterYear !== "all" || startDate || endDate) && (
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
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-right">Show</Label>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 pl-6 w-44">Date</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 w-28">Status</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 w-28">Check In</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 w-28">Check Out</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 w-28">Duration</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 w-36">Source</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 max-w-[200px]">Notes</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase text-muted-foreground py-3 text-right pr-6 w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                        <span>No matching attendance records found.</span>
                      </div>
                    </td>
                  </TableRow>
                ) : (
                  paginatedHistory.map((record) => (
                    <TableRow key={record.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold text-xs py-3.5 pl-6">{formatDateFriendly(record.date)}</TableCell>
                      <TableCell className="py-3.5">{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="font-mono text-xs py-3.5 text-foreground">{formatTimeFriendly(record.checkIn)}</TableCell>
                      <TableCell className="font-mono text-xs py-3.5 text-foreground">{formatTimeFriendly(record.checkOut)}</TableCell>
                      <TableCell className="font-semibold text-xs py-3.5 text-foreground">
                        {getDurationString(record.checkIn, record.checkOut)}
                      </TableCell>
                      <TableCell className="py-3.5">{getSourceBadge(record.source)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3.5 max-w-[200px] truncate" title={record.notes}>
                        {record.notes || "-"}
                      </TableCell>
                      <TableCell className="py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this attendance record?")) {
                                deleteRecord(record.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <div className="text-xs text-muted-foreground font-semibold">
              Showing {filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredHistory.length)} of {filteredHistory.length} records
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl text-xs h-8 cursor-pointer"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-xl text-xs h-8 w-8 p-0 cursor-pointer ${
                    currentPage === page ? "bg-primary text-primary-foreground font-bold" : ""
                  }`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl text-xs h-8 cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- ADD DIALOG --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Add Manual Attendance</DialogTitle>
            <DialogDescription>
              Log check-in/out stamps for a specific date in the past.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-bold">Select Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className="rounded-xl text-xs bg-muted/40 border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkIn" className="text-xs font-bold">Check In Time</Label>
                <Input
                  id="checkIn"
                  type="time"
                  required
                  value={addCheckIn}
                  onChange={(e) => setAddCheckIn(e.target.value)}
                  className="rounded-xl text-xs bg-muted/40 border-border text-foreground font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkOut" className="text-xs font-bold">Check Out Time</Label>
                <Input
                  id="checkOut"
                  type="time"
                  required
                  value={addCheckOut}
                  onChange={(e) => setAddCheckOut(e.target.value)}
                  className="rounded-xl text-xs bg-muted/40 border-border text-foreground font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-bold">Status</Label>
              <select
                id="status"
                value={addStatus}
                onChange={(e) => setAddStatus(e.target.value as AttendanceRecord["status"])}
                className="w-full h-9 rounded-xl border border-border bg-muted/40 text-xs text-foreground px-3 py-1 focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
              >
                <option value="PRESENT">Present (Full Day)</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">On Leave</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-bold">Reason/Notes</Label>
              <Input
                id="notes"
                type="text"
                placeholder="e.g. Offsite meeting, forgot to punch"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                className="rounded-xl text-xs bg-muted/40 border-border text-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl text-xs bg-primary text-primary-foreground font-bold cursor-pointer">
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update check-in/out times or logs for this record.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="editDate" className="text-xs font-bold">Date</Label>
              <Input
                id="editDate"
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-xl text-xs bg-muted/40 border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editCheckIn" className="text-xs font-bold">Check In Time</Label>
                <Input
                  id="editCheckIn"
                  type="time"
                  required
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  className="rounded-xl text-xs bg-muted/40 border-border text-foreground font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editCheckOut" className="text-xs font-bold">Check Out Time</Label>
                <Input
                  id="editCheckOut"
                  type="time"
                  placeholder="In progress..."
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  className="rounded-xl text-xs bg-muted/40 border-border text-foreground font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editStatus" className="text-xs font-bold">Status</Label>
              <select
                id="editStatus"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AttendanceRecord["status"])}
                className="w-full h-9 rounded-xl border border-border bg-muted/40 text-xs text-foreground px-3 py-1 focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
              >
                <option value="PRESENT">Present (Full Day)</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">On Leave</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editNotes" className="text-xs font-bold">Reason/Notes</Label>
              <Input
                id="editNotes"
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="rounded-xl text-xs bg-muted/40 border-border text-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl text-xs bg-primary text-primary-foreground font-bold cursor-pointer">
                Apply Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
