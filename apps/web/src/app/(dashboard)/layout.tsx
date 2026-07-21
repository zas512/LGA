import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const { user } = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar user={user} />

      {/* Main Right Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
