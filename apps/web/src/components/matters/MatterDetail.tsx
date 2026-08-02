"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Briefcase,
  Gavel,
  CheckCircle2,
  FolderClosed,
  Loader2,
  Scale,
  GitBranch,
  UserCheck,
  Download,
  AlertCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

// Subcomponents
import { MatterOverview } from "./MatterOverview";
import { MatterTimeline } from "./MatterTimeline";
import { MatterHearings } from "./MatterHearings";
import { MatterTasks } from "./MatterTasks";
import { MatterDocuments } from "./MatterDocuments";
import { MatterParties } from "./MatterParties";
import { Label } from "../ui/label";

interface MatterDetailProps {
  id: string;
  userRole: string;
  userId: string;
}

interface CourtStage {
  id: string;
  name: string;
  caseType: string;
  sequenceOrder: number;
}

interface Associate {
  id: string;
  name?: string | null;
  email: string;
}

export function MatterDetail({ id, userRole }: Readonly<MatterDetailProps>) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "hearings" | "tasks" | "documents" | "parties"
  >("overview");

  // Admin dialogs state
  const [isStageOpen, setIsStageOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssociateId, setSelectedAssociateId] = useState("");
  const [associateRole, setAssociateRole] = useState("Associate");

  const isAdmin = userRole === "OWNER" || userRole === "ADMIN";

  // 1. Fetch Matter details
  const {
    data: matter,
    isLoading,
    error
  } = useQuery({
    queryKey: ["matter", id],
    queryFn: async () => {
      const res = await fetch(`/api/matters/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch matter");
      }
      return res.json();
    }
  });

  // 2. Fetch available Court Stages for transitions
  const { data: stages = [] } = useQuery<CourtStage[]>({
    queryKey: ["court-stages"],
    queryFn: async () => {
      const res = await fetch("/api/matters/stages");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin
  });

  // Filter stages matching current matter's caseType
  const filteredStages = useMemo(() => {
    if (!matter) return [];
    return stages
      .filter((s) => s.caseType === matter.caseType)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [stages, matter]);

  // 3. Fetch Associates for assigning to legal team
  const { data: associates = [] } = useQuery<Associate[]>({
    queryKey: ["associates"],
    queryFn: async () => {
      const res = await fetch("/api/associates");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin
  });

  // Filter out associates already assigned
  const unassignedAssociates = useMemo(() => {
    if (!matter || !associates) return [];
    const assignedIds = new Set(
      matter.associates.map((a: { associateId: string }) => a.associateId)
    );
    return associates.filter((a) => !assignedIds.has(a.id));
  }, [associates, matter]);

  // Mutations
  const changeStageMutation = useMutation({
    mutationFn: async (currentStageId: string) => {
      const res = await fetch(`/api/matters/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStageId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to change stage");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Procedural court stage updated successfully.");
      setIsStageOpen(false);
      queryClient.invalidateQueries({ queryKey: ["matter", id] });
      queryClient.invalidateQueries({ queryKey: ["matter-timeline", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/matters/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to change status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Matter status updated.");
      setIsStatusOpen(false);
      queryClient.invalidateQueries({ queryKey: ["matter", id] });
      queryClient.invalidateQueries({ queryKey: ["matters"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const assignAssociateMutation = useMutation({
    mutationFn: async (payload: { associateId: string; role: string }) => {
      const res = await fetch(`/api/matters/${id}/associates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to assign associate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Counsel added to the matter legal team.");
      setIsAssignOpen(false);
      setSelectedAssociateId("");
      setAssociateRole("Associate");
      queryClient.invalidateQueries({ queryKey: ["matter", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const handleStageTransition = () => {
    if (!selectedStageId) return;
    changeStageMutation.mutate(selectedStageId);
  };

  const handleStatusTransition = () => {
    if (!selectedStatus) return;
    changeStatusMutation.mutate(selectedStatus);
  };

  const handleAssignAssociate = () => {
    if (!selectedAssociateId) return;
    assignAssociateMutation.mutate({
      associateId: selectedAssociateId,
      role: associateRole
    });
  };

  // Helper styles
  const getStatusBadge = (status: string) => {
    let variant: "emerald" | "destructive" | "amber" | "outline" = "outline";
    if (status === "ACTIVE") variant = "emerald";
    else if (status === "DECIDED") variant = "amber";
    else if (status === "CLOSED" || status === "ARCHIVED")
      variant = "destructive";

    return (
      <Badge
        variant={variant}
        className="text-xs font-bold uppercase tracking-wider"
      >
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
          Loading matter workspace...
        </p>
      </div>
    );
  }

  if (error || !matter) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 text-destructive p-8 max-w-xl mx-auto text-center rounded-2xl shadow-sm">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="font-extrabold text-lg mt-3">
          Access Denied or Case Not Found
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {error instanceof Error
            ? error.message
            : "You might not be assigned to this matter or it belongs to a different tenant."}
        </p>
        <Link href="/matters" className="inline-block mt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            Return to Ledger
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to List breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/matters">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-sm font-bold gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Matters Ledger</span>
          </Button>
        </Link>

        {/* Action Panel for OWNER/ADMIN */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStageId(matter.currentStageId || "");
                setIsStageOpen(true);
              }}
              className="rounded-xl text-sm font-bold gap-1 border-border h-8"
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Change Stage</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStatus(matter.status);
                setIsStatusOpen(true);
              }}
              className="rounded-xl text-sm font-bold gap-1 border-border h-8"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Status</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignOpen(true)}
              className="rounded-xl text-sm font-bold gap-1 border-border h-8"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Assign Counsel</span>
            </Button>

            {/* Dynamic PDF Report download */}
            <a
              href={`/api/matters/${id}/summary-report`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm rounded-xl px-3 py-1.5 h-8 select-none"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Summary PDF</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Matter Header Card */}
      <Card className="skeuo-card bg-card text-card-foreground relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase text-primary tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                  {matter.caseType}
                </span>
                {getStatusBadge(matter.status)}
                {matter.cnr && (
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded border border-border">
                    CNR: {matter.cnr}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-foreground pt-1">
                {matter.clientName}{" "}
                <span className="text-muted-foreground font-normal">
                  v. Opposition
                </span>
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                <span>
                  Internal Ref: <strong>{matter.firmCaseNumber}</strong>
                </span>
                {matter.courtCaseNumber && (
                  <>
                    <span>•</span>
                    <span>
                      Court Ref: <strong>{matter.courtCaseNumber}</strong>
                    </span>
                  </>
                )}
                {matter.court && (
                  <>
                    <span>•</span>
                    <span>
                      Venue: <strong>{matter.court}</strong>
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Current Stage Display */}
            {matter.currentStage && (
              <div className="bg-muted/30 border border-border/80 p-3 rounded-2xl md:text-right shrink-0">
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Current Legal Stage
                </p>
                <p className="text-base font-extrabold text-primary mt-0.5">
                  {matter.currentStage.name}
                </p>
                <span className="text-xs text-muted-foreground font-semibold">
                  Sequence order: #{matter.currentStage.sequenceOrder}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Selector Bar */}
      <div className="flex items-center border-b border-border overflow-x-auto gap-1 pb-1">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("overview")}
          className={`rounded-xl text-sm font-bold px-4 py-2 h-9 shrink-0 ${
            activeTab === "overview"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>Case Overview</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTab("timeline")}
          className={`rounded-xl text-sm font-bold px-4 py-2 h-9 shrink-0 ${
            activeTab === "timeline"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <GitBranch className="h-3.5 w-3.5" />
          <span>Case Timeline</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTab("hearings")}
          className={`rounded-xl text-sm font-bold px-4 py-2 h-9 shrink-0 ${
            activeTab === "hearings"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Gavel className="h-3.5 w-3.5" />
          <span>Hearings Ledger</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTab("tasks")}
          className={`rounded-xl text-sm font-bold px-4 py-2 h-9 shrink-0 ${
            activeTab === "tasks"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Tasks & Checklist</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTab("documents")}
          className={`rounded-xl text-sm font-bold px-4 py-2 h-9 shrink-0 ${
            activeTab === "documents"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <FolderClosed className="h-3.5 w-3.5" />
          <span>Case Documents</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTab("parties")}
          className={`rounded-xl text-sm font-bold px-4 py-2 h-9 shrink-0 ${
            activeTab === "parties"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>Litigants & Parties</span>
        </Button>
      </div>

      {/* Render Active Tab */}
      <div className="pt-2">
        {activeTab === "overview" && <MatterOverview matter={matter} />}
        {activeTab === "timeline" && <MatterTimeline id={id} />}
        {activeTab === "hearings" && (
          <MatterHearings id={id} userRole={userRole} />
        )}
        {activeTab === "tasks" && <MatterTasks id={id} userRole={userRole} />}
        {activeTab === "documents" && (
          <MatterDocuments id={id} userRole={userRole} />
        )}
        {activeTab === "parties" && (
          <MatterParties matter={matter} userRole={userRole} />
        )}
      </div>

      {/* dialogs for admin features */}
      {isAdmin && (
        <>
          {/* Change Stage Dialog */}
          <Dialog open={isStageOpen} onOpenChange={setIsStageOpen}>
            <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground">
                  Transition Procedural Stage
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Update the case stage according to the civil/criminal lawsuit
                  sequence. This writes to the audit log.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="stageSelect"
                    className="text-xs font-bold text-foreground"
                  >
                    Choose Legal Stage
                  </Label>
                  <select
                    id="stageSelect"
                    value={selectedStageId}
                    onChange={(e) => setSelectedStageId(e.target.value)}
                    className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
                  >
                    <option value="">Select Stage</option>
                    {filteredStages.map((s) => (
                      <option key={s.id} value={s.id}>
                        Stage {s.sequenceOrder}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsStageOpen(false)}
                  className="rounded-xl text-sm font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStageTransition}
                  disabled={changeStageMutation.isPending || !selectedStageId}
                  className="skeuo-button-primary rounded-xl text-sm font-bold gap-1"
                >
                  {changeStageMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Update Stage</span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Change Status Dialog */}
          <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground">
                  Change Case Lifecycle Status
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Archived matters are soft-deleted and hidden from standard
                  rosters. Decided/Closed status reserves the record.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="statusSelect"
                    className="text-xs font-bold text-foreground"
                  >
                    Lifecycle Status
                  </Label>
                  <select
                    id="statusSelect"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">Active (In Trial)</option>
                    <option value="DECIDED">Decided (Decreed)</option>
                    <option value="CLOSED">Closed (Settled)</option>
                    <option value="ARCHIVED">Archived (Soft Delete)</option>
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsStatusOpen(false)}
                  className="rounded-xl text-sm font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusTransition}
                  disabled={changeStatusMutation.isPending || !selectedStatus}
                  className="skeuo-button-primary rounded-xl text-sm font-bold"
                >
                  {changeStatusMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Update Status</span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Assign Associate Dialog */}
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground">
                  Assign Counsel / Associate
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Add an associate to the legal defense team and define their
                  case role.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Associate selection */}
                <div className="space-y-1">
                  <Label
                    htmlFor="assocSelect"
                    className="text-xs font-bold text-foreground"
                  >
                    Legal Staff
                  </Label>
                  <select
                    id="assocSelect"
                    value={selectedAssociateId}
                    onChange={(e) => setSelectedAssociateId(e.target.value)}
                    className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
                  >
                    <option value="">Select associate</option>
                    {unassignedAssociates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role label */}
                <div className="space-y-1">
                  <Label
                    htmlFor="roleInput"
                    className="text-xs font-bold text-foreground"
                  >
                    Case Role Label
                  </Label>
                  <select
                    id="roleInput"
                    value={associateRole}
                    onChange={(e) => setAssociateRole(e.target.value)}
                    className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
                  >
                    <option value="Lead Counsel">Lead Counsel</option>
                    <option value="Associate">Associate Counsel</option>
                    <option value="Co-Counsel">Co-Counsel</option>
                    <option value="Legal Assistant">Legal Assistant</option>
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAssignOpen(false);
                    setSelectedAssociateId("");
                  }}
                  className="rounded-xl text-sm font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignAssociate}
                  disabled={
                    assignAssociateMutation.isPending || !selectedAssociateId
                  }
                  className="skeuo-button-primary rounded-xl text-sm font-bold gap-1"
                >
                  {assignAssociateMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Assign Roster</span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
