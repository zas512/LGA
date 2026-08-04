"use client";
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
import { useAuth } from "@/components/auth/AuthProvider";

const loginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login: authLogin } = useAuth();

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
    <Card className="border-border bg-card text-card-foreground shadow-xs py-4">
      <h1 className="sr-only">Sign in to Laal Global Advisory</h1>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
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
              className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-full"
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
              className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-full"
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
      </CardContent>
    </Card>
  );
}
