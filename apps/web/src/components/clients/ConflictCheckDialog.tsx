"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConflictCheckResult } from "@/types/clientTypes";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ConflictCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed?: () => void;
}

export function ConflictCheckDialog({
  open,
  onOpenChange,
  onProceed
}: Readonly<ConflictCheckDialogProps>) {
  const [name, setName] = useState("");
  const [cnic, setCnic] = useState("");
  const [result, setResult] = useState<ConflictCheckResult | null>(null);

  const checkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/clients/conflict-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cnic: cnic || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Conflict check failed");
      }
      return data as ConflictCheckResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Conflict check completed and logged to the audit trail.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Conflict check failed");
    }
  });

  const totalMatches =
    (result?.clients.length ?? 0) +
    (result?.parties.length ?? 0) +
    (result?.legacyMatters.length ?? 0);

  const handleClose = (openNext: boolean) => {
    if (!openNext) {
      setResult(null);
      setName("");
      setCnic("");
    }
    onOpenChange(openNext);
  };

  const renderMatters = (
    matters?: ConflictCheckResult["clients"][number]["matters"]
  ) => {
    if (!matters || matters.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          No linked matters on record.
        </p>
      );
    }
    return (
      <ul className="mt-1 space-y-1">
        {matters.map((m) => (
          <li
            key={m.id}
            className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5"
          >
            <span className="font-bold text-foreground">
              {m.firmCaseNumber}
            </span>
            <Badge variant="navy" className="text-[10px]">
              {m.caseType}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {m.status}
            </Badge>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Conflict Check
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Searches existing clients, case parties, and legacy matter names.
            Advisory only — every check is logged; a human makes the final call.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label
                htmlFor="cc-name"
                className="text-xs font-bold text-foreground"
              >
                Name / Organization *
              </Label>
              <Input
                id="cc-name"
                placeholder="e.g. Ahmed & Sons Traders"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="cc-cnic"
                className="text-xs font-bold text-foreground"
              >
                CNIC / NTN (optional)
              </Label>
              <Input
                id="cc-cnic"
                placeholder="e.g. 35202-1234567-1"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleClose(false)}
                className="rounded-xl text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={checkMutation.isPending || !name.trim()}
                onClick={() => checkMutation.mutate()}
                className="skeuo-button-primary rounded-xl text-sm font-bold gap-1.5"
              >
                {checkMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Run Check</span>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {totalMatches === 0 ? (
              <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
                <ShieldCheck className="h-10 w-10 text-success mx-auto" />
                <p className="font-bold text-foreground mt-3">
                  No potential conflicts found
                </p>
                <p className="text-sm text-muted-foreground">
                  No matching clients, parties, or legacy matters were found for
                  this name.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {totalMatches} potential match
                      {totalMatches > 1 ? "es" : ""} found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Review the matches below. This is advisory — nothing is
                      blocked automatically.
                    </p>
                  </div>
                </div>

                {result.clients.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                      Existing Clients
                    </h4>
                    {result.clients.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-border bg-muted/10 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-foreground text-sm">
                            {c.name}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {[c.phone, c.email, c.cnic]
                            .filter(Boolean)
                            .join(" · ") || "No contact details"}
                        </p>
                        {renderMatters(c.matters)}
                      </div>
                    ))}
                  </div>
                )}

                {result.parties.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                      Case Parties
                    </h4>
                    {result.parties.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-border bg-muted/10 p-3"
                      >
                        <p className="font-bold text-foreground text-sm">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {[p.phone, p.email].filter(Boolean).join(" · ") ||
                            "No contact details"}
                        </p>
                        {renderMatters(p.matters)}
                      </div>
                    ))}
                  </div>
                )}

                {result.legacyMatters.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                      Legacy Matter References
                    </h4>
                    {result.legacyMatters.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-border bg-muted/10 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-foreground text-sm">
                            {m.firmCaseNumber}
                          </p>
                          <Badge variant="navy" className="text-[10px]">
                            {m.caseType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Party on record:{" "}
                          <span className="font-semibold">{m.clientName}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setResult(null);
                  setName("");
                  setCnic("");
                }}
                className="rounded-xl text-sm font-bold"
              >
                Run Another Check
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onProceed?.();
                  handleClose(false);
                }}
                className="skeuo-button-primary rounded-xl text-sm font-bold gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                No conflict, proceed
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
