import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, DollarSign, Shield, UserPlus } from "lucide-react";

export default async function DashboardPage() {
  const { user } = await getSession();

  if (!user) {
    redirect("/login");
  }

  const canManageTeam = user.role === "OWNER" || user.role === "ADMIN";

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Firm Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Laal Global Advisory — Internal Management System
          </p>
        </div>
        <div className="flex items-center gap-4">
          {canManageTeam && (
            <Link href="/team">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-medium"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Manage Team
              </Button>
            </Link>
          )}
          <div className="text-right">
            <p className="text-xs font-semibold">{user.email}</p>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
              {user.role}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Associates
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">
              Firm associates enrolled
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Today
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Unified</div>
            <p className="text-xs text-muted-foreground">
              Biometric + Remote Check-in
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Fixed + Manual</div>
            <p className="text-xs text-muted-foreground">
              Salaries & subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tenant Context
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono truncate">
              {user.firmId || "Platform Admin"}
            </div>
            <p className="text-xs text-muted-foreground">
              Isolated firm boundary
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session Details Card */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base">
            Server-Side Session Info (SSR)
          </CardTitle>
          <CardDescription>
            Rendered securely on the server via Next.js Server Components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-xs">
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/40 rounded">
            <span className="font-semibold text-muted-foreground">
              User ID:
            </span>
            <span className="col-span-2">{user.sub}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/40 rounded">
            <span className="font-semibold text-muted-foreground">Email:</span>
            <span className="col-span-2">{user.email}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/40 rounded">
            <span className="font-semibold text-muted-foreground">Role:</span>
            <span className="col-span-2">{user.role}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/40 rounded">
            <span className="font-semibold text-muted-foreground">
              Firm ID:
            </span>
            <span className="col-span-2">{user.firmId || "N/A"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
