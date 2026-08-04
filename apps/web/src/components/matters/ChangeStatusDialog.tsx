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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "../ui/label";

interface ChangeStatusDialogProps {
  matterId: string;
  currentStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeStatusDialog({
  matterId,
  currentStatus,
  open,
  onOpenChange
}: Readonly<ChangeStatusDialogProps>) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const changeStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/matters/${matterId}/status`, {
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
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matters"] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-foreground">
            Change Case Lifecycle Status
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Archived matters are soft-deleted and hidden from standard rosters.
            Decided/Closed status reserves the record.
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
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-sm font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={() => changeStatusMutation.mutate(selectedStatus)}
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
  );
}
