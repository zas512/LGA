import { AccountSetup } from "@/components/auth/AccountSetup";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const { user } = await getSession();

  if (!user) {
    redirect("/login");
  }
  // First-login screen is only for accounts that must change their password;
  // everyone else belongs in the app.
  if (!user.mustChangePassword) {
    redirect(user.role === "SUPER_ADMIN" ? "/platform" : "/dashboard");
  }

  return <AccountSetup />;
}
