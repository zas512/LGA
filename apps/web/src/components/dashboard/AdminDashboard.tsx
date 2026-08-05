import dynamic from "next/dynamic";
import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/format";
import { backendFetch } from "@/lib/server-api";
import { Receipt, Wallet } from "lucide-react";
import type { ExpenseRecord } from "@/app/(dashboard)/dashboard/page";

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

function isFixedExpense(e: ExpenseRecord): boolean {
  const type = (e.type ?? "").toUpperCase();
  return type === "FIXED" || type === "SALARY" || type === "PAYROLL";
}

interface AdminStats {
  expenses: ExpenseRecord[];
  fixedTotal: number;
  manualTotal: number;
  expensesTotal: number;
}

async function loadAdminStats(): Promise<AdminStats> {
  const empty: AdminStats = {
    expenses: [],
    fixedTotal: 0,
    manualTotal: 0,
    expensesTotal: 0
  };
  try {
    const expensesRes = await backendFetch("/expenses").catch(() => null);
    const expenses: ExpenseRecord[] = expensesRes?.ok
      ? await expensesRes.json().catch(() => [])
      : [];
    const fixedTotal = expenses
      .filter(isFixedExpense)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const manualTotal = expenses
      .filter((e) => !isFixedExpense(e))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return {
      expenses,
      fixedTotal,
      manualTotal,
      expensesTotal: fixedTotal + manualTotal
    };
  } catch {
    return empty;
  }
}

/**
 * ADMIN sees only the firm's expenses — no headcount or attendance tiles.
 * Mirrors the role matrix: ADMIN manages expenses and nothing else.
 */
export async function AdminDashboard() {
  const { expenses, fixedTotal, manualTotal, expensesTotal } =
    await loadAdminStats();

  return (
    <div className="space-y-6">
      <HeaderUpdater title="Expense Overview" breadcrumb="Billing" />

      {/* Expense summary */}
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
            {formatPKR(expensesTotal)}
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
                {formatPKR(fixedTotal)}
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
                {formatPKR(manualTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <DashboardAnalytics expenses={expenses} />
    </div>
  );
}
