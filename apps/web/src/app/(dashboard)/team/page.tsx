import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
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
    <div className="space-y-6">
      <Header
        userRole={user.role}
        title="Associate & Team Roster"
        breadcrumb="Team Management"
      />
      <TeamManagementClient />
    </div>
  );
}
