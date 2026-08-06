"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  Calendar,
  User,
  Clock,
  Briefcase,
  Building,
  Users,
  ShieldAlert
} from "lucide-react";

interface MatterOverviewProps {
  matter: {
    id: string;
    firmCaseNumber: string;
    courtCaseNumber?: string | null;
    cnr?: string | null;
    caseType: string;
    court?: string | null;
    bench?: string | null;
    presidingJudge?: string | null;
    status: string;
    filingDate?: string | null;
    clientName: string;
    clientId?: string | null;
    client?: { id: string; name: string } | null;
    createdAt: string;
    updatedAt: string;
    currentStage?: {
      name: string;
    } | null;
    associates: Array<{
      id: string;
      associateId: string;
      role?: string | null;
      associate?: {
        fullName: string;
        email: string;
        designation: string;
      } | null;
    }>;
  };
}

export function MatterOverview({ matter }: Readonly<MatterOverviewProps>) {
  // Format Date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getStatusBadge = (status: string) => {
    let variant: "emerald" | "destructive" | "amber" | "outline" = "outline";
    if (status === "ACTIVE") variant = "emerald";
    else if (status === "DECIDED") variant = "amber";
    else if (status === "CLOSED" || status === "ARCHIVED")
      variant = "destructive";

    return (
      <Badge variant={variant} className="text-xs font-bold uppercase">
        {status}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Primary Details Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="skeuo-card bg-card text-card-foreground">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold uppercase tracking-wider text-primary">
              Case Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Name */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Client Name
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {matter.client?.name || matter.clientName}
                </p>
              </div>
            </div>

            {/* Case Type */}
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Case Classification
                </p>
                <div className="mt-0.5">
                  <Badge variant="navy" className="text-sm font-bold uppercase">
                    {matter.caseType}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Internal Ref */}
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Firm Reference #
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {matter.firmCaseNumber}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Matter Status
                </p>
                <div className="mt-0.5">{getStatusBadge(matter.status)}</div>
              </div>
            </div>

            {/* Filing Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Filing Date
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {formatDate(matter.filingDate)}
                </p>
              </div>
            </div>

            {/* Current Stage */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Current Stage
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {matter.currentStage?.name || "No procedural stage assigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Court Information Card */}
        <Card className="skeuo-card bg-card text-card-foreground">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold uppercase tracking-wider text-primary">
              Court Jurisdiction & Bench Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Court */}
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Court Venue
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {matter.court || "Not specified / Pending"}
                </p>
              </div>
            </div>

            {/* Bench */}
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Bench Reference
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {matter.bench || "Not specified"}
                </p>
              </div>
            </div>

            {/* Presiding Judge */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Presiding Judge
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {matter.presidingJudge || "Not specified / Honorable Judge"}
                </p>
              </div>
            </div>

            {/* Court Case Number */}
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Court Case ID
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {matter.courtCaseNumber || "Not registered yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Team Column */}
      <div className="space-y-6">
        <Card className="skeuo-card bg-card text-card-foreground h-full">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Assigned Legal Team</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {matter.associates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-semibold text-muted-foreground mt-2">
                  No counsel assigned
                </p>
              </div>
            ) : (
              matter.associates.map((item) => {
                const name = item.associate?.fullName || "Unresolved Associate";
                const email = item.associate?.email || "";
                const designation = item.associate?.designation || "Counsel";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-all shadow-2xs"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-foreground truncate">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-extrabold text-primary bg-primary/10 border border-primary/15 px-1.5 py-0.5 rounded-full uppercase">
                          {item.role || "Counsel"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {designation}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
