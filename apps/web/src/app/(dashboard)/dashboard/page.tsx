import dynamic from "next/dynamic";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { AssociateDashboard } from "@/components/dashboard/AssociateDashboard";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { PendingApprovals } from "@/components/dashboard/PendingApprovals";
import { UpcomingHearings } from "@/components/dashboard/UpcomingHearings";
import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/format";
import { backendFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import {
  AlertTriangle,
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

export interface UpcomingHearing {
  id: string;
  matterId: string;
  hearingDate: string;
  purpose: string;
  status: string;
  presidingJudge?: string | null;
  matter?: {
    id: string;
    firmCaseNumber: string;
    courtCaseNumber?: string | null;
    clientName: string;
    court?: string | null;
    bench?: string | null;
    caseType?: string | null;
    currentStage?: { name: string } | null;
  } | null;
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
  hearings: UpcomingHearing[];
  /** Whether each source actually returned usable data — a failed source must
   *  surface as "unavailable", never as zero. */
  associatesOk: boolean;
  attendanceOk: boolean;
  expensesOk: boolean;
  hearingsOk: boolean;
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
    manualTotal: null,
    hearings: [],
    associatesOk: false,
    attendanceOk: false,
    expensesOk: false,
    hearingsOk: false
  };

  try {
    const [associatesRes, attendanceRes, expensesRes, hearingsRes] =
      await Promise.all([
        backendFetch("/associates").catch(() => null),
        backendFetch("/attendance/firm").catch(() => null),
        backendFetch("/expenses").catch(() => null),
        backendFetch("/hearings/upcoming").catch(() => null)
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
    const hearings: UpcomingHearing[] = hearingsRes?.ok
      ? await hearingsRes.json().catch(() => [])
      : [];

    // A source counts as OK only if the request succeeded AND the body parsed
    // to a usable array. Anything else is "unavailable", not zero.
    const associatesOk = Array.isArray(associates);
    const attendanceOk = Array.isArray(attendance);
    const expensesOk = Array.isArray(expenses);
    const hearingsOk = Array.isArray(hearings);

    const totalAssociates = associatesOk ? associates.length : null;

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    const todayRecords = attendance.filter((r) =>
      r.date?.startsWith(todayKey)
    );

    const presentSet = new Set(
      todayRecords
        .filter((r) => r.status === "PRESENT")
        .map((r) => r.associateId)
    );
    const leaveSet = new Set(
      todayRecords
        .filter((r) => r.status === "LEAVE")
        .map((r) => r.associateId)
    );
    // Remote = distinct associates whose only presence today came from a remote
    // check-in. Someone with a biometric PRESENT record is present, not remote,
    // so they must not be counted twice.
    const remoteSet = new Set(
      todayRecords
        .filter(
          (r) =>
            r.source === "REMOTE_CHECKIN" && !presentSet.has(r.associateId)
        )
        .map((r) => r.associateId)
    );

    const present = presentSet.size;
    const leave = leaveSet.size;
    const remote = remoteSet.size;
    // Absent is only trustworthy when both headcount and today's attendance
    // actually loaded; otherwise the whole-firm "absent" figure is fabricated.
    const absent =
      associatesOk && attendanceOk
        ? Math.max(0, associates.length - present - leave - remote)
        : null;

    const fixedTotal = expenses
      .filter(isFixedExpense)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const manualTotal = expenses
      .filter((e) => !isFixedExpense(e))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expensesTotal = fixedTotal + manualTotal;

    return {
      totalAssociates,
      present: associatesOk && attendanceOk ? present : null,
      absent,
      leave: associatesOk && attendanceOk ? leave : null,
      remote: associatesOk && attendanceOk ? remote : null,
      expenses,
      expensesTotal: expensesOk ? expensesTotal : null,
      fixedTotal: expensesOk ? fixedTotal : null,
      manualTotal: expensesOk ? manualTotal : null,
      hearings,
      associatesOk,
      attendanceOk,
      expensesOk,
      hearingsOk
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
    manualTotal,
    hearings,
    associatesOk,
    attendanceOk,
    expensesOk,
    hearingsOk
  } = stats;

  const expenseValue = expensesTotal == null ? "—" : formatPKR(expensesTotal);
  const fixedValue = fixedTotal == null ? "—" : formatPKR(fixedTotal);
  const manualValue = manualTotal == null ? "—" : formatPKR(manualTotal);

  // Surface failed sources explicitly instead of silently showing partial data
  // as fact. Retry = refresh (this is a server-rendered view).
  const failedSources = [
    !associatesOk && "Headcount",
    !attendanceOk && "Attendance",
    !expensesOk && "Expenses",
    !hearingsOk && "Hearings"
  ].filter((s): s is string => typeof s === "string");

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <HeaderUpdater title="Firm Operational Dashboard" breadcrumb="Overview" />

      {/* Partial-fetch warning: a failed source is "unavailable", never zero. */}
      {failedSources.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-warning-foreground">
              Some data couldn&apos;t be loaded
            </p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {failedSources.join(", ")}{" "}
              {failedSources.length === 1 ? "is" : "are"} unavailable — showing
              a partial overview.{" "}
              <a
                href="/dashboard"
                className="font-bold text-warning-foreground underline underline-offset-2 hover:opacity-80"
              >
                Retry
              </a>
            </p>
          </div>
        </div>
      )}

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
            <div className="text-4xl font-black text-foreground tracking-tight">
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
            <div className="text-4xl font-black text-foreground tracking-tight">
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

      {/* Upcoming Tareekh + Pending approvals — the day's two "what needs me" queues. */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <UpcomingHearings hearings={hearings} ok={hearingsOk} />
        <PendingApprovals />
      </div>

      {/* Analytics & Data Table */}
      <DashboardAnalytics expenses={expenses} />
    </div>
  );
}
