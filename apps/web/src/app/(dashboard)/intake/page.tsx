import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { IntakeClient } from "@/components/intake/IntakeClient";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const ALLOWED_ROLES = ["OWNER", "ASSOCIATE"];

export default async function IntakePage() {
  const { user } = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(user.role)) {
    redirect("/dashboard");
  }
  return (
    <div className="space-y-6">
      <HeaderUpdater
        title="Lead Intake Pipeline"
        breadcrumb="New Business Intake"
      />
      <IntakeClient userRole={user.role} />
    </div>
  );
}
