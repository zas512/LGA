"use client";
import { useState } from "react";
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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Simple form submit handler for now
  async function onSubmit() {
    setIsLoading(true);
    // Auth logic with TanStack query / service will go here
    setTimeout(() => setIsLoading(false), 1000);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Pane: Branding Sidebar (Hidden on mobile) */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:col-span-4 lg:flex border-r border-border/10">
        <div className="flex items-center gap-2 font-sans text-lg font-semibold tracking-tight">
          <div className="h-4 w-4 rounded-full bg-white/90" />
          LexFirm CRM
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
          Secure Tenant Gate v2.0
        </div>
      </div>

      {/* Right Pane: Login Card Surface */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 lg:col-span-8">
        <div className="w-full max-w-100 space-y-6">
          <Card className="border-border/40 shadow-sm bg-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-sans tracking-tight">
                Secure Access
              </CardTitle>
              <CardDescription className="text-sm">
                Enter your credentials to sign in to your terminal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
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
                    placeholder="name@firm.com"
                    required
                    disabled={isLoading}
                    className="bg-background border-border/60 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold tracking-tight text-foreground/80"
                    >
                      Security Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    disabled={isLoading}
                    className="bg-background border-border/60 focus-visible:ring-primary/50"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full mt-2 font-sans tracking-tight"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Sign In to Terminal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
