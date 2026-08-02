import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { HeaderUpdater } from "@/components/layout/HeaderUpdater";
import { MatterDetail } from "@/components/matters/MatterDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatterDetailPage({
  params
}: Readonly<PageProps>) {
  const { user } = await getSession();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <div className="space-y-6">
      <HeaderUpdater
        title="Matter Details Workspace"
        breadcrumb="Case Details"
      />
      <MatterDetail id={id} userRole={user.role} userId={user.sub} />
    </div>
  );
}
