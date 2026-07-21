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

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
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
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:col-span-4 lg:flex border-r border-border/10">
        <div className="flex items-center gap-2 font-sans text-lg font-semibold tracking-tight">
          <div className="h-4 w-4 rounded-full bg-white/90" />
          Laal Global Advisory
        </div>

        <div className="space-y-2">
          <p className="font-serif text-3xl leading-relaxed tracking-wide text-white">
            &quot;Jurisprudence is the knowledge of things divine and
            human.&quot;
          </p>
          <p className="font-sans text-sm tracking-tight text-primary-foreground/70">
            — Ulpian, Digest of Roman Law
          </p>
        </div>

        <div className="text-xs text-primary-foreground/50 tracking-tight">
          Internal Management Portal v1.0
        </div>
      </div>

      {/* Right Pane: Login Surface */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 lg:col-span-8">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-border/40 shadow-sm bg-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-sans tracking-tight">
                Secure Access
              </CardTitle>
              <CardDescription className="text-sm">
                Enter your credentials to sign in to your LGA account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <div className="mb-4 rounded bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold tracking-tight text-foreground/80"
                  >
                    Professional Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@laalglobal.com"
                    {...register("email")}
                    disabled={loginMutation.isPending}
                    className="bg-background border-border/60 focus-visible:ring-primary/50"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold tracking-tight text-foreground/80"
                    >
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    disabled={loginMutation.isPending}
                    className="bg-background border-border/60 focus-visible:ring-primary/50"
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 font-sans tracking-tight"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending
                    ? "Authenticating..."
                    : "Sign In to LGA"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
