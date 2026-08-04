"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { ExpenseRecord } from "@/app/(dashboard)/dashboard/page";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const FIXED_EXPENSE_TYPES = new Set(["FIXED", "SALARY", "PAYROLL"]);
const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)"
];

function aggregateExpenses(expenses: ExpenseRecord[]) {
  const monthlyMap = new Map<string, { fixed: number; manual: number }>();
  const categoryMap = new Map<string, number>();

  for (const e of expenses) {
    const amount = Number(e.amount) || 0;
    if (amount <= 0) continue;
    const dateStr = e.date || e.createdAt || "";
    const monthKey = dateStr.slice(0, 7);
    const isFixed = FIXED_EXPENSE_TYPES.has((e.type ?? "").toUpperCase());

    if (monthKey) {
      const entry = monthlyMap.get(monthKey) ?? { fixed: 0, manual: 0 };
      if (isFixed) entry.fixed += amount;
      else entry.manual += amount;
      monthlyMap.set(monthKey, entry);
    }

    const category = e.category?.trim() || "Other";
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + amount);
  }

  const monthlyData = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, value]) => ({
      month: new Date(`${monthKey}-01`).toLocaleDateString(undefined, {
        month: "short"
      }),
      fixed: value.fixed,
      manual: value.manual
    }));

  const categoryTotals = [...categoryMap.entries()];
  const grandTotal =
    categoryTotals.reduce((sum, [, value]) => sum + value, 0) || 1;
  const categoryData = categoryTotals
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value], i) => ({
      name,
      value: Math.round((value / grandTotal) * 100),
      color: CHART_COLORS[i % CHART_COLORS.length]
    }));

  return { monthlyData, categoryData };
}

function EmptyChartState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="md:col-span-12 border-border bg-card text-card-foreground shadow-xs">
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-medium">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <PieIcon className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-bold text-foreground">
            No expense records yet
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Expense trends and allocation charts will appear here once billing
            data is recorded for this firm.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardAnalytics({
  expenses = []
}: {
  expenses?: ExpenseRecord[];
}) {
  const { monthlyData, categoryData } = useMemo(
    () => aggregateExpenses(expenses),
    [expenses]
  );

  if (monthlyData.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyChartState
          title="Monthly Financial Overhead"
          description="Fixed payroll salaries vs manual operational expenses"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Chart: Monthly Expense Trends */}
        <Card className="md:col-span-7 border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Monthly Financial Overhead
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                Fixed payroll salaries vs manual operational expenses
              </CardDescription>
            </div>
            <Badge variant="navy">
              {new Date().getFullYear()} Fiscal
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--muted-foreground)",
                      fontWeight: 600
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--muted-foreground)",
                      fontWeight: 600
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                      color: "var(--card-foreground)",
                      fontWeight: 600
                    }}
                    formatter={(value) =>
                      new Intl.NumberFormat("en-PK", {
                        style: "currency",
                        currency: "PKR",
                        maximumFractionDigits: 0
                      }).format(Number(value) || 0)
                    }
                  />
                  <Bar
                    dataKey="fixed"
                    name="Fixed Salaries"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="manual"
                    name="Manual Expenses"
                    fill="var(--chart-2)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Chart: Category Breakdown Donut */}
        <Card className="md:col-span-5 border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" />
                Expense Allocation
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                Categorical distribution of firm budget
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    shape={(props) => {
                      const { ...rest } = props;
                      return <path {...rest} fill={props.payload.color} />;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      fontSize: "12px",
                      color: "var(--card-foreground)",
                      fontWeight: 600
                    }}
                    formatter={(value) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              {categoryData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground font-semibold truncate">
                    {item.name}:
                  </span>
                  <span className="font-bold text-foreground">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
