import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
  const { user } = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <Header
        userRole={user.role}
        title="Firm Operational Dashboard"
        breadcrumb="Overview"
      />

      {/* 4 Executive Metric Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
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
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[82%]" />
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-2">
              10 Active In-House Associates
            </p>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border-border bg-card text-card-foreground shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Attendance Today
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-3xl font-black text-foreground tracking-tight">
              95.4%
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[95%]" />
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-2">
              Hikvision Biometric + Remote Sync
            </p>
          </CardContent>
        </Card>

        {/* Metric 3 */}
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
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[68%]" />
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-2">
              Auto Payroll + Recurring Expenses
            </p>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border-border bg-card text-card-foreground shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Firm Security Boundary
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-extrabold text-foreground truncate">
              {user.firmId ? "LGA Isolated" : "Platform Admin"}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono font-semibold mt-3 truncate">
              {user.firmId || "SUPER_ADMIN"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Data Table */}
      <DashboardAnalytics />
    </div>
  );
}
