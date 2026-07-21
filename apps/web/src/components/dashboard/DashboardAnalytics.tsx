"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, PieChart as PieIcon, MoreVertical } from "lucide-react";

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

const recentInvoices = [
  {
    id: "EXP-1047",
    matter: "Corporate Merger Compliance",
    associate: "Zain Ali (Lead)",
    date: "Apr 10, 2026",
    status: "Pending Approval",
    badgeVariant: "navy" as const,
    amount: "$7,700"
  },
  {
    id: "EXP-1046",
    matter: "Contract Review & Negotiation",
    associate: "Hammad Laal (Owner)",
    date: "Apr 07, 2026",
    status: "Auto-Generated",
    badgeVariant: "emerald" as const,
    amount: "$3,500"
  },
  {
    id: "EXP-1045",
    matter: "ChatGPT Pro & Software Subs",
    associate: "Assistant Admin",
    date: "Mar 18, 2026",
    status: "Auto-Generated",
    badgeVariant: "emerald" as const,
    amount: "$2,800"
  },
  {
    id: "EXP-1044",
    matter: "Intellectual Property Filing",
    associate: "Associate Counsel",
    date: "Apr 02, 2026",
    status: "Overdue",
    badgeVariant: "destructive" as const,
    amount: "$5,200"
  }
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
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
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

      {/* Data Table Section using Shadcn Table */}
      <Card className="border-border bg-card text-card-foreground shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-extrabold text-foreground">
              Recent Expense Ledger & Billings
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium">
              Latest firm expenditures logged by associates and administrators
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold border-border"
          >
            View All Records
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-2">ENTRY ID</TableHead>
                <TableHead>MATTER / CATEGORY</TableHead>
                <TableHead>LOGGED BY</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right pr-4">AMOUNT</TableHead>
                <TableHead className="text-center">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="pl-2 font-mono font-bold text-primary">
                    {inv.id}
                  </TableCell>
                  <TableCell className="font-bold text-foreground">
                    {inv.matter}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">
                    {inv.associate}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">
                    {inv.date}
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.badgeVariant}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4 font-black text-foreground">
                    {inv.amount}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
