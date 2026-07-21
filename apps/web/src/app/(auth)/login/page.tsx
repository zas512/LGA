"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Scale } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to sign in");
      }
      return result;
    },
    onSuccess: (data) => {
      if (data.user?.role === "SUPER_ADMIN") {
        router.push("/platform");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
    }
  });

  function onSubmit(values: LoginFormValues) {
    setErrorMessage(null);
    loginMutation.mutate(values);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Pane: Branding Sidebar */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:col-span-5 lg:flex border-r border-border/20">
        <div className="flex items-center gap-3 font-sans text-xl font-bold tracking-tight text-primary-foreground">
          <div className="h-10 w-10 rounded-xl bg-white/10 text-primary-foreground flex items-center justify-center font-bold border border-white/20 shadow-xs">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div>Laal Global Advisory</div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70 font-semibold">
              Internal Law Firm CRM
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-serif text-3xl leading-relaxed tracking-wide text-primary-foreground/90 italic">
            &quot;Jurisprudence is the knowledge of things divine and human, the science of the just and the unjust.&quot;
          </p>
          <p className="font-sans text-xs uppercase tracking-widest text-primary-foreground/70 font-bold">
            — Ulpian, Digest of Roman Law
          </p>
        </div>

        <div className="text-xs text-primary-foreground/60 tracking-tight flex items-center justify-between font-medium">
          <span>Secure Firm Portal v1.0</span>
          <span>© {new Date().getFullYear()} LGA</span>
        </div>
      </div>

      {/* Right Pane: Login Form Surface */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:col-span-7">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-border bg-card text-card-foreground shadow-xs p-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Firm Account Sign In
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                Enter your credentials to access your legal terminal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <div className="mb-4 rounded-xl bg-destructive/15 p-3 text-xs text-destructive font-semibold border border-destructive/20">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-foreground">
                    Professional Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@laalglobal.com"
                    {...register("email")}
                    disabled={loginMutation.isPending}
                    className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-xl"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive font-semibold">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold text-foreground">
                    Security Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    disabled={loginMutation.isPending}
                    className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-xl"
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive font-semibold">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm tracking-tight h-10 mt-2 shadow-xs"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Authenticating..." : "Sign In to LGA Terminal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
