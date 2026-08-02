import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { MattersList } from "@/components/matters/MattersList";

export default async function MattersPage() {
  const { user } = await getSession();
  if (!user) {
    redirect("/login");
  }
  return (
    <div className="space-y-6">
      <HeaderUpdater
        title="Matters & Cases Dashboard"
        breadcrumb="Matters Ledger"
      />
      <MattersList userRole={user.role} />
    </div>
  );
}
