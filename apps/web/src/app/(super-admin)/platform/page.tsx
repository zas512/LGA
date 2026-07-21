import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { ShieldCheck, Building2 } from "lucide-react";

export default async function PlatformPage() {
  const { user } = await getSession();

  if (user?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Super Admin Platform
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-Tenant Administration Portal
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold">{user.email}</p>
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive border border-destructive/20">
              {user.role}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tenant Management
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 Firm</div>
            <p className="text-xs text-muted-foreground">
              Laal Global Advisory (LGA)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Status
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Platform Mode</div>
            <p className="text-xs text-muted-foreground">
              No firm isolation lock on Super Admin
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base">
            Platform Super Admin Session (SSR)
          </CardTitle>
          <CardDescription>
            Authenticated with superadmin credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-xs">
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/40 rounded">
            <span className="font-semibold text-muted-foreground">Email:</span>
            <span className="col-span-2">{user.email}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/40 rounded">
            <span className="font-semibold text-muted-foreground">Role:</span>
            <span className="col-span-2">{user.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
