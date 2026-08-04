"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import type { Associate } from "@/types/matterTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Label } from "../ui/label";

interface AssignAssociateDialogProps {
  matterId: string;
  assignedAssociateIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignAssociateDialog({
  matterId,
  assignedAssociateIds,
  open,
  onOpenChange
}: Readonly<AssignAssociateDialogProps>) {
  const queryClient = useQueryClient();
  const [selectedAssociateId, setSelectedAssociateId] = useState("");
  const [associateRole, setAssociateRole] = useState("Associate");

  const { data: associates = [] } = useQuery<Associate[]>({
    queryKey: ["associates"],
    queryFn: async () => {
      const res = await fetch("/api/associates");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open
  });

  const unassignedAssociates = useMemo(() => {
    const assignedIds = new Set(assignedAssociateIds);
    return associates.filter((a) => !assignedIds.has(a.id));
  }, [associates, assignedAssociateIds]);

  const assignAssociateMutation = useMutation({
    mutationFn: async (payload: { associateId: string; role: string }) => {
      const res = await fetch(`/api/matters/${matterId}/associates`, {
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
      onOpenChange(false);
      setSelectedAssociateId("");
      setAssociateRole("Associate");
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-foreground">
            Assign Counsel / Associate
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add an associate to the legal defense team and define their case
            role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
              onOpenChange(false);
              setSelectedAssociateId("");
            }}
            className="rounded-xl text-sm font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              selectedAssociateId &&
              assignAssociateMutation.mutate({
                associateId: selectedAssociateId,
                role: associateRole
              })
            }
            disabled={assignAssociateMutation.isPending || !selectedAssociateId}
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
  );
}
