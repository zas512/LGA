"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AttendanceProvider } from "@/components/attendance/AttendanceContext";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export default function Providers({
  children
}: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <AttendanceProvider>
            <Provider store={store}>{children}</Provider>
            <Toaster position="top-right" richColors closeButton />
          </AttendanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
