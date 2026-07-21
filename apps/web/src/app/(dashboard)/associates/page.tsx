import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { AssociatesClient } from "@/components/associates/AssociatesClient";

export default async function AssociatesPage() {
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
        title="Law Firm Associates & Staff"
        breadcrumb="Associates Directory"
      />
      <AssociatesClient userRole={user.role} />
    </div>
  );
}
