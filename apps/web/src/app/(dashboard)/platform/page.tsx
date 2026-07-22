import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PlatformClient } from "@/components/platform/PlatformClient";

export default async function PlatformPage() {
  const { user } = await getSession();

  if (user?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return <PlatformClient />;
}
