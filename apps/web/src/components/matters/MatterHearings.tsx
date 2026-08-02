"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Gavel,
  Calendar,
  Clock,
  Plus,
  Loader2,
  FileText,
  User,
  ArrowRight,
  ExternalLink,
  Users
} from "lucide-react";

// Log Outcome Schema
const logOutcomeSchema = z.object({
  status: z.enum(["HELD", "ADJOURNED", "SINE_DIE", "DECIDED"]),
  proceedingsSummary: z.string().min(5, { message: "Proceedings summary must be at least 5 characters" }),
  orderSheetUrl: z.string().optional(),
  nextDate: z.string().optional(),
  nextPurpose: z.string().optional(),
  attendeeAssociateIds: z.array(z.string()).optional()
});

type LogOutcomeValues = z.infer<typeof logOutcomeSchema>;

// Schedule Hearing Schema
const scheduleHearingSchema = z.object({
  hearingDate: z.string().min(1, { message: "Hearing date is required" }),
  purpose: z.string().min(3, { message: "Purpose must be at least 3 characters" }),
  presidingJudge: z.string().optional(),
  attendeeAssociateIds: z.array(z.string()).optional()
});

type ScheduleHearingValues = z.infer<typeof scheduleHearingSchema>;

interface Associate {
  id: string;
  name?: string | null;
  email: string;
}

interface Hearing {
  id: string;
  matterId: string;
  hearingDate: string;
  purpose: string;
  presidingJudge?: string | null;
  proceedingsSummary?: string | null;
  orderSheetUrl?: string | null;
  nextDate?: string | null;
  nextPurpose?: string | null;
  status: "SCHEDULED" | "HELD" | "ADJOURNED" | "SINE_DIE" | "DECIDED";
  createdById: string;
  createdAt: string;
  attendees: Array<{
    id: string;
    hearingId: string;
    associateId: string;
  }>;
}

interface MatterHearingsProps {
  id: string;
  userRole: string;
}

export function MatterHearings({ id, userRole }: Readonly<MatterHearingsProps>) {
  const queryClient = useQueryClient();
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const canEdit = userRole === "OWNER" || userRole === "ADMIN" || userRole === "ASSOCIATE";

  // 1. Fetch Hearings list
  const {
    data: hearings = [],
    isLoading,
    refetch,
    isRefetching
  } = useQuery<Hearing[]>({
    queryKey: ["matter-hearings", id],
    queryFn: async () => {
      const res = await fetch(`/api/matters/${id}/hearings`);
      if (!res.ok) {
        throw new Error("Failed to fetch hearings");
      }
      return res.json();
    }
  });

  // 2. Fetch Associates for attendee check listing
  const { data: associates = [] } = useQuery<Associate[]>({
    queryKey: ["associates"],
    queryFn: async () => {
      const res = await fetch("/api/associates");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const associateMap = useMemo(() => {
    return new Map(associates.map((a) => [a.id, a.name || a.email]));
  }, [associates]);

  // Log Outcome Form
  const {
    register: registerLog,
    handleSubmit: handleSubmitLog,
    reset: resetLog,
    setValue: setValueLog,
    watch: watchLog,
    formState: { errors: errorsLog, isSubmitting: isSubmittingLog }
  } = useForm<LogOutcomeValues>({
    resolver: zodResolver(logOutcomeSchema),
    defaultValues: {
      status: "HELD",
      proceedingsSummary: "",
      orderSheetUrl: "",
      nextDate: "",
      nextPurpose: "",
      attendeeAssociateIds: []
    }
  });

  const selectedLogAttendees = watchLog("attendeeAssociateIds") || [];

  // Schedule Hearing Form
  const {
    register: registerSched,
    handleSubmit: handleSubmitSched,
    reset: resetSched,
    setValue: setValueSched,
    watch: watchSched,
    formState: { errors: errorsSched, isSubmitting: isSubmittingSched }
  } = useForm<ScheduleHearingValues>({
    resolver: zodResolver(scheduleHearingSchema),
    defaultValues: {
      hearingDate: "",
      purpose: "",
      presidingJudge: "",
      attendeeAssociateIds: []
    }
  });

  const selectedSchedAttendees = watchSched("attendeeAssociateIds") || [];

  // Log Outcome Mutation
  const logMutation = useMutation({
    mutationFn: async (values: LogOutcomeValues) => {
      if (!selectedHearing) return;
      const payload = {
        ...values,
        nextDate: values.nextDate ? new Date(values.nextDate).toISOString() : null,
        nextPurpose: values.nextPurpose || null,
        orderSheetUrl: values.orderSheetUrl || null,
        attendeeAssociateIds: values.attendeeAssociateIds?.length ? values.attendeeAssociateIds : undefined
      };
      const res = await fetch(`/api/hearings/${selectedHearing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to log outcome");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Hearing outcome logged and registered successfully.");
      resetLog();
      setIsLogOpen(false);
      setSelectedHearing(null);
      queryClient.invalidateQueries({ queryKey: ["matter-hearings", id] });
      queryClient.invalidateQueries({ queryKey: ["matter-timeline", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to log outcome");
    }
  });

  // Schedule Mutation
  const scheduleMutation = useMutation({
    mutationFn: async (values: ScheduleHearingValues) => {
      const payload = {
        ...values,
        hearingDate: new Date(values.hearingDate).toISOString(),
        attendeeAssociateIds: values.attendeeAssociateIds?.length ? values.attendeeAssociateIds : undefined
      };
      const res = await fetch(`/api/matters/${id}/hearings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to schedule hearing");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("New court hearing scheduled successfully.");
      resetSched();
      setIsScheduleOpen(false);
      queryClient.invalidateQueries({ queryKey: ["matter-hearings", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to schedule hearing");
    }
  });

  const onLogSubmit = (values: LogOutcomeValues) => {
    logMutation.mutate(values);
  };

  const onSchedSubmit = (values: ScheduleHearingValues) => {
    scheduleMutation.mutate(values);
  };

  const handleAttendeeToggleLog = (assocId: string) => {
    const current = [...selectedLogAttendees];
    const idx = current.indexOf(assocId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(assocId);
    }
    setValueLog("attendeeAssociateIds", current);
  };

  const handleAttendeeToggleSched = (assocId: string) => {
    const current = [...selectedSchedAttendees];
    const idx = current.indexOf(assocId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(assocId);
    }
    setValueSched("attendeeAssociateIds", current);
  };

  const openLogDialog = (hearing: Hearing) => {
    setSelectedHearing(hearing);
    resetLog();
    setValueLog("attendeeAssociateIds", hearing.attendees.map((a) => a.associateId));
    setIsLogOpen(true);
  };

  // Split hearings
  const upcomingHearings = useMemo(() => {
    return hearings
      .filter((h) => h.status === "SCHEDULED")
      .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime());
  }, [hearings]);

  const pastHearings = useMemo(() => {
    return hearings
      .filter((h) => h.status !== "SCHEDULED")
      .sort((a, b) => new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime());
  }, [hearings]);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Court Hearings Ledger</h3>
          <p className="text-sm text-muted-foreground font-medium">Log courtroom proceedings outcome and maintain next-date (Tareekh-e-Pesh) updates.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              onClick={() => setIsScheduleOpen(true)}
              className="skeuo-button-primary rounded-xl text-sm font-bold gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Hearing</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl text-sm font-semibold border-border"
          >
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Upcoming Hearings */}
      <Card className="skeuo-card bg-card text-card-foreground">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Upcoming Scheduled Hearings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 space-y-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground ml-2">Fetching scheduled court dates...</span>
            </div>
          ) : upcomingHearings.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No upcoming hearings scheduled. Use &ldquo;Schedule Hearing&rdquo; to add one.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Court Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Purpose</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Presiding Judge</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Attendees</TableHead>
                  {canEdit && <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4 text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingHearings.map((h) => (
                  <TableRow key={h.id} className="border-b border-border hover:bg-muted/20">
                    <TableCell className="px-4 py-2 text-sm font-bold text-foreground">
                      {new Date(h.hearingDate).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm font-semibold text-muted-foreground">{h.purpose}</TableCell>
                    <TableCell className="px-4 py-2 text-sm font-semibold text-muted-foreground">{h.presidingJudge || "N/A"}</TableCell>
                    <TableCell className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {h.attendees.map((att) => (
                          <Badge key={att.id} variant="outline" className="text-xs py-0 px-1.5 font-semibold">
                            {associateMap.get(att.associateId) || "Counsel"}
                          </Badge>
                        ))}
                        {h.attendees.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                      </div>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="px-4 py-2 text-right">
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => openLogDialog(h)}
                          className="rounded-xl text-xs font-bold px-2 py-1"
                        >
                          Log Outcome
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Hearings */}
      <Card className="skeuo-card bg-card text-card-foreground">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            <span>Past Hearings Proceedings History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          ) : pastHearings.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No historical proceedings recorded for this matter.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Court Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Purpose</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Outcome Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Proceedings Summary</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4">Next Hearing Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground h-9 px-4 text-center">Docs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastHearings.map((h) => (
                  <TableRow key={h.id} className="border-b border-border hover:bg-muted/10">
                    <TableCell className="px-4 py-2 text-sm font-semibold text-foreground">
                      {new Date(h.hearingDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm font-semibold text-muted-foreground">{h.purpose}</TableCell>
                    <TableCell className="px-4 py-2 text-sm">
                      <Badge
                        variant={h.status === "HELD" ? "emerald" : h.status === "DECIDED" ? "amber" : "destructive"}
                        className="text-xs font-bold uppercase"
                      >
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground font-medium italic max-w-[250px] truncate" title={h.proceedingsSummary ?? ""}>
                      {h.proceedingsSummary || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm font-bold text-primary">
                      {h.nextDate ? (
                        <div className="flex items-center gap-1">
                          <span>{new Date(h.nextDate).toLocaleDateString()}</span>
                          {h.nextPurpose && <span className="text-xs text-muted-foreground">({h.nextPurpose})</span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-semibold">None (Sine Die / Decided)</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      {h.orderSheetUrl ? (
                        <a
                          href={h.orderSheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 text-primary hover:bg-primary/10 rounded-full border border-border"
                          title="View Order Sheet"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground/60 font-bold">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Outcome Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="max-w-xl bg-card border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">Log Proceedings & Outcomes</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Submit courtroom outcomes. Entering a next date will auto-schedule the next date (Tareekh-e-Pesh).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitLog(onLogSubmit)} className="space-y-4 py-2">
            {/* Status Select */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Hearing Outcome Status *</Label>
              <select
                id="status"
                {...registerLog("status")}
                className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
              >
                <option value="HELD">Held / Proceeded</option>
                <option value="ADJOURNED">Adjourned / Postponed</option>
                <option value="SINE_DIE">Adjourned Sine Die (Indefinitely)</option>
                <option value="DECIDED">Decided / Judgment Reserved</option>
              </select>
            </div>

            {/* Proceedings Summary */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Proceedings Summary *</Label>
              <textarea
                id="proceedingsSummary"
                placeholder="Log details of argument, witness statement, issues framed..."
                rows={3}
                {...registerLog("proceedingsSummary")}
                className="w-full text-sm p-3 rounded-xl border border-border bg-card text-foreground font-medium outline-none focus:border-primary focus-visible:ring-primary/40 resize-none"
              />
              {errorsLog.proceedingsSummary && (
                <p className="text-xs text-destructive font-semibold">{errorsLog.proceedingsSummary.message}</p>
              )}
            </div>

            {/* Order Sheet URL */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Court Order Sheet Link (URL)</Label>
              <Input
                id="orderSheetUrl"
                placeholder="e.g. https://storage.lga.dev/orders/order-sheet.pdf"
                {...registerLog("orderSheetUrl")}
                className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
              />
            </div>

            {/* Next Date & Purpose (Tareekh-e-Pesh Engine) */}
            <div className="grid grid-cols-2 gap-4 border border-border/80 rounded-xl p-3 bg-muted/10">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Next Court Date (Tareekh)</Label>
                <Input
                  id="nextDate"
                  type="date"
                  {...registerLog("nextDate")}
                  className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Next Date Purpose</Label>
                <Input
                  id="nextPurpose"
                  placeholder="e.g. Replication / Arguments"
                  {...registerLog("nextPurpose")}
                  className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                />
              </div>
            </div>

            {/* Attendance checklist */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground block flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Log Attending Associates</span>
              </Label>
              <div className="border border-border rounded-xl p-3 bg-muted/20 grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto">
                {associates.map((assoc) => {
                  const isChecked = selectedLogAttendees.includes(assoc.id);
                  return (
                    <div
                      key={assoc.id}
                      onClick={() => handleAttendeeToggleLog(assoc.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm font-semibold cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-card border-border hover:bg-muted/50"
                      }`}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} className="pointer-events-none rounded text-primary" />
                      <span className="truncate leading-tight">{assoc.name || assoc.email}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsLogOpen(false);
                  setSelectedHearing(null);
                }}
                className="rounded-xl text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingLog}
                className="skeuo-button-primary rounded-xl text-sm font-bold gap-1.5"
              >
                {isSubmittingLog ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Log Proceedings</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Hearing Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-xl bg-card border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">Schedule Court Hearing</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Formally schedule an upcoming hearing date in the court ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSched(onSchedSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Hearing Date */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Hearing Date & Time *</Label>
                <Input
                  id="hearingDate"
                  type="datetime-local"
                  {...registerSched("hearingDate")}
                  className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                />
                {errorsSched.hearingDate && (
                  <p className="text-xs text-destructive font-semibold">{errorsSched.hearingDate.message}</p>
                )}
              </div>

              {/* Presiding Judge */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Presiding Judge</Label>
                <Input
                  id="presidingJudge"
                  placeholder="e.g. Judge West Division"
                  {...registerSched("presidingJudge")}
                  className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Hearing Purpose *</Label>
              <Input
                id="purpose"
                placeholder="e.g. Replication / Framing of Issues / Cross Exam"
                {...registerSched("purpose")}
                className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
              />
              {errorsSched.purpose && (
                <p className="text-xs text-destructive font-semibold">{errorsSched.purpose.message}</p>
              )}
            </div>

            {/* Assign Attendees checklist */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground block flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Assign Counsel to Attend</span>
              </Label>
              <div className="border border-border rounded-xl p-3 bg-muted/20 grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto">
                {associates.map((assoc) => {
                  const isChecked = selectedSchedAttendees.includes(assoc.id);
                  return (
                    <div
                      key={assoc.id}
                      onClick={() => handleAttendeeToggleSched(assoc.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm font-semibold cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-card border-border hover:bg-muted/50"
                      }`}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} className="pointer-events-none rounded text-primary" />
                      <span className="truncate leading-tight">{assoc.name || assoc.email}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetSched();
                  setIsScheduleOpen(false);
                }}
                className="rounded-xl text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingSched}
                className="skeuo-button-primary rounded-xl text-sm font-bold gap-1.5"
              >
                {isSubmittingSched ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <span>Schedule Hearing</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
