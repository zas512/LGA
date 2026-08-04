import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import {
  DollarSign,
  Laptop,
  Palmtree,
  Receipt,
  UserCheck,
  Users,
  UserX,
  Wallet
} from "lucide-react";

export default async function DashboardPage() {
  const { user } = await getSession();

  if (user?.role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <HeaderUpdater title="Firm Operational Dashboard" breadcrumb="Overview" />
      {/* 2 Executive Metric Summary Cards */}
      <div className="grid gap-4 grid-cols-2">
        {/* Metric 1: Total Associates */}
        <Card className="border-border bg-card text-card-foreground shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Associates
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-3xl font-black text-foreground tracking-tight">
              128
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-1 mb-4">
              Firm-wide headcount
            </p>

            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/50 py-2.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm font-bold text-foreground">96</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Present
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/50 py-2.5">
                <UserX className="h-3.5 w-3.5 text-red-500" />
                <span className="text-sm font-bold text-foreground">8</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Absent
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/50 py-2.5">
                <Palmtree className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-sm font-bold text-foreground">14</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  On Leave
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/50 py-2.5">
                <Laptop className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-sm font-bold text-foreground">10</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Remote
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Expense Tracking */}
        <Card className="border-border bg-card text-card-foreground shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Billings & Costs
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-3xl font-black text-foreground tracking-tight">
              $150,200
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-1 mb-4">
              Auto Payroll + Recurring Expenses
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Invoiced Today
                  </span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  $8,400
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Expensed Today
                  </span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  $2,150
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Analytics & Data Table */}
      <DashboardAnalytics />
    </div>
  );
}
