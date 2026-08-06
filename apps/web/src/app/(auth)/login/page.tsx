"use client";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { googleAuthUrl } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login: authLogin } = useAuth();
  const [googleNoAccount, setGoogleNoAccount] = useState(false);

  // Read ?google=no_account without useSearchParams (avoids the Suspense
  // wrapper); clears the query param so the notice doesn't persist on reload.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "no_account") {
      setGoogleNoAccount(true);
      params.delete("google");
      const next = params.toString();
      window.history.replaceState(
        null,
        "",
        next ? `${window.location.pathname}?${next}` : window.location.pathname
      );
    }
  }, []);

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
      await authLogin(data);
    },
    onError: (err: Error) => {
      console.error("[Client Auth] Login error:", err.message);
    }
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <Card className="skeuo-card bg-card text-card-foreground relative overflow-hidden py-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/80 to-chart-2" />
      <h1 className="sr-only">Sign in to Laal Global Advisory</h1>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-black tracking-tight text-foreground">
          Firm Account Sign In
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-medium">
          Enter your credentials to access your legal terminal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          method="POST"
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-bold text-foreground"
            >
              Professional Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...register("email")}
              disabled={loginMutation.isPending}
              className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-xl"
            />
            {errors.email && (
              <p className="text-xs text-destructive font-semibold">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-bold text-foreground"
            >
              Security Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              {...register("password")}
              disabled={loginMutation.isPending}
              className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-xl"
            />
            {errors.password && (
              <p className="text-xs text-destructive font-semibold">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm tracking-tight h-10 mt-2 shadow-xs"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending
              ? "Authenticating..."
              : "Sign In to LGA Terminal"}
          </Button>
        </form>

        {/* Google no-account notice (from the OAuth callback) */}
        {googleNoAccount && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              No account was found for that Google profile — ask your firm
              admin for an invitation.
            </span>
          </div>
        )}

        {/* Divider + Google sign-in (only when Google is enabled) */}
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                or
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleButton href={googleAuthUrl()} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
