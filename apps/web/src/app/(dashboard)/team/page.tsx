import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { TeamManagementClient } from "@/components/team/TeamManagementClient";

export default async function TeamPage() {
  const { user } = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-sm text-muted-foreground">
            Create firm employee accounts and manage access permissions
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">{user.email}</p>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
            {user.role}
          </span>
        </div>
      </div>
      <TeamManagementClient />
    </div>
  );
}
