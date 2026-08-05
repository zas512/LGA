import dynamic from "next/dynamic";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { AssociateDashboard } from "@/components/dashboard/AssociateDashboard";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/format";
import { backendFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import {
  Laptop,
  Palmtree,
  Receipt,
  UserCheck,
  Users,
  UserX,
  Wallet
} from "lucide-react";

const DashboardAnalytics = dynamic(
  () =>
    import("@/components/dashboard/DashboardAnalytics").then(
      (mod) => mod.DashboardAnalytics
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center py-16 text-xs font-semibold text-muted-foreground">
        Loading analytics...
      </div>
    )
  }
);

interface AttendanceRecord {
  id: string;
  associateId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
  source: "MANUAL" | "BIOMETRIC_IMPORT" | "REMOTE_CHECKIN";
}

export interface ExpenseRecord {
  amount?: number;
  date?: string;
  createdAt?: string;
  category?: string;
  type?: string;
}

interface FirmStats {
  totalAssociates: number | null;
  present: number | null;
  absent: number | null;
  leave: number | null;
  remote: number | null;
  expenses: ExpenseRecord[];
  expensesTotal: number | null;
  fixedTotal: number | null;
  manualTotal: number | null;
}

function isFixedExpense(e: ExpenseRecord): boolean {
  const type = (e.type ?? "").toUpperCase();
  return type === "FIXED" || type === "SALARY" || type === "PAYROLL";
}

async function loadFirmStats(): Promise<FirmStats> {
  const empty: FirmStats = {
    totalAssociates: null,
    present: null,
    absent: null,
    leave: null,
    remote: null,
    expenses: [],
    expensesTotal: null,
    fixedTotal: null,
    manualTotal: null
  };

  try {
    const [associatesRes, attendanceRes, expensesRes] = await Promise.all([
      backendFetch("/associates").catch(() => null),
      backendFetch("/attendance/firm").catch(() => null),
      backendFetch("/expenses").catch(() => null)
    ]);

    const associates = associatesRes?.ok
      ? await associatesRes.json().catch(() => [])
      : [];
    const attendance: AttendanceRecord[] = attendanceRes?.ok
      ? await attendanceRes.json().catch(() => [])
      : [];
    const expenses: ExpenseRecord[] = expensesRes?.ok
      ? await expensesRes.json().catch(() => [])
      : [];

    const totalAssociates = Array.isArray(associates)
      ? associates.length
      : null;

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    const todayRecords = attendance.filter((r) =>
      r.date?.startsWith(todayKey)
    );

    const distinctByStatus = (status: AttendanceRecord["status"]) =>
      new Set(
        todayRecords
          .filter((r) => r.status === status)
          .map((r) => r.associateId)
      ).size;

    const present = distinctByStatus("PRESENT");
    const leave = distinctByStatus("LEAVE");
    const remote = todayRecords.filter(
      (r) => r.source === "REMOTE_CHECKIN"
    ).length;
    const absent =
      totalAssociates == null
        ? null
        : Math.max(0, totalAssociates - present - leave - remote);

    const fixedTotal = expenses
      .filter(isFixedExpense)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const manualTotal = expenses
      .filter((e) => !isFixedExpense(e))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expensesTotal = fixedTotal + manualTotal;

    return {
      totalAssociates,
      present: totalAssociates == null ? null : present,
      absent,
      leave: totalAssociates == null ? null : leave,
      remote: totalAssociates == null ? null : remote,
      expenses,
      expensesTotal: Array.isArray(expenses) ? expensesTotal : null,
      fixedTotal: Array.isArray(expenses) ? fixedTotal : null,
      manualTotal: Array.isArray(expenses) ? manualTotal : null
    };
  } catch {
    return empty;
  }
}

function StatTile({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/50 ring-1 ring-inset ring-border/40 py-2.5 px-1 text-center">
      {icon}
      <span className="text-sm font-black text-foreground">
        {value == null ? "—" : value}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const { user } = await getSession();

  if (user?.role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }

  // ADMIN: expenses are the only surface they manage.
  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  // ASSOCIATE: personal tasks + attendance, no firm-wide stats.
  if (user?.role === "ASSOCIATE") {
    return <AssociateDashboard />;
  }

  const stats = await loadFirmStats();
  const {
    totalAssociates,
    present,
    absent,
    leave,
    remote,
    expenses,
    expensesTotal,
    fixedTotal,
    manualTotal
  } = stats;

  const expenseValue = expensesTotal == null ? "—" : formatPKR(expensesTotal);
  const fixedValue = fixedTotal == null ? "—" : formatPKR(fixedTotal);
  const manualValue = manualTotal == null ? "—" : formatPKR(manualTotal);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <HeaderUpdater title="Firm Operational Dashboard" breadcrumb="Overview" />
      {/* 2 Executive Metric Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Metric 1: Total Associates */}
        <Card className="skeuo-card bg-card text-card-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/80 to-chart-2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Associates
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-3xl font-black text-foreground tracking-tight">
              {totalAssociates == null ? "—" : totalAssociates}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-1 mb-4">
              Firm-wide headcount
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatTile
                icon={<UserCheck className="h-3.5 w-3.5 text-success" />}
                label="Present"
                value={present}
              />
              <StatTile
                icon={<UserX className="h-3.5 w-3.5 text-destructive" />}
                label="Absent"
                value={absent}
              />
              <StatTile
                icon={<Palmtree className="h-3.5 w-3.5 text-warning" />}
                label="On Leave"
                value={leave}
              />
              <StatTile
                icon={<Laptop className="h-3.5 w-3.5 text-info" />}
                label="Remote"
                value={remote}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Expense & Billing Overview */}
        <Card className="skeuo-card bg-card text-card-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/80 to-chart-2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Expenses & Billings
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-3xl font-black text-foreground tracking-tight">
              {expenseValue}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-1 mb-4">
              Fixed salaries + manual operational expenses (PKR)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-success" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Fixed Salaries
                  </span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {fixedValue}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Manual Expenses
                  </span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {manualValue}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Analytics & Data Table */}
      <DashboardAnalytics expenses={expenses} />
    </div>
  );
}
