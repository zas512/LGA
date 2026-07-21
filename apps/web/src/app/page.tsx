import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { user } = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "SUPER_ADMIN") {
    redirect("/platform");
  }
  redirect("/dashboard");
}
