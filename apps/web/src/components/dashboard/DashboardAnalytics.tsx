"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";
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

const monthlyExpenseData = [
  { month: "Jan", fixed: 45000, manual: 12000 },
  { month: "Feb", fixed: 45000, manual: 18500 },
  { month: "Mar", fixed: 48000, manual: 14200 },
  { month: "Apr", fixed: 48000, manual: 22100 },
  { month: "May", fixed: 52000, manual: 16800 },
  { month: "Jun", fixed: 52000, manual: 19400 }
];

const categoryDistribution = [
  { name: "Salaries (HR)", value: 55, color: "var(--color-chart-1)" },
  { name: "Subscriptions", value: 18, color: "var(--color-chart-2)" },
  { name: "Office & Rent", value: 15, color: "var(--color-chart-3)" },
  { name: "Legal Travel", value: 12, color: "var(--color-chart-4)" }
];

export function DashboardAnalytics() {
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
            <Badge variant="navy">2026 Fiscal</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyExpenseData}
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
                    data={categoryDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
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
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              {categoryDistribution.map((item) => (
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
