"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { UserPlus, Shield, Users, RefreshCw } from "lucide-react";

const createMemberSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(["ADMIN", "ASSOCIATE"], {
    error: "Role must be ADMIN or ASSOCIATE"
  })
});

type CreateMemberValues = z.infer<typeof createMemberSchema>;

interface TeamMember {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "ASSOCIATE";
  firmId: string;
  isActive: boolean;
  createdAt: string;
}

export function TeamManagementClient() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: teamMembers = [],
    isLoading,
    isRefetching,
    refetch
  } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error("Failed to fetch team members");
      }
      return res.json();
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateMemberValues>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "ASSOCIATE"
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateMemberValues) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to create team member");
      }
      return result;
    },
    onSuccess: () => {
      setSuccessMessage("Employee account created successfully.");
      reset();
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
    }
  });

  function onSubmit(values: CreateMemberValues) {
    setErrorMessage(null);
    setSuccessMessage(null);
    createMutation.mutate(values);
  }

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* Create Member Form Card */}
      <Card className="border-border/40 md:col-span-5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create Firm Employee
          </CardTitle>
          <CardDescription>
            Register a new associate or admin under your firm. All created
            employees share your firm identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded bg-destructive/15 p-3 text-xs text-destructive font-medium border border-destructive/20">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded bg-emerald-500/15 p-3 text-xs text-emerald-600 font-medium border border-emerald-500/20">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold">
                Employee Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@firm.com"
                {...register("email")}
                disabled={createMutation.isPending}
                className="bg-background"
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold">
                Initial Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register("password")}
                disabled={createMutation.isPending}
                className="bg-background"
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-semibold">
                Assigned Role
              </Label>
              <select
                id="role"
                {...register("role")}
                disabled={createMutation.isPending}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ASSOCIATE">ASSOCIATE (Legal Associate)</option>
                <option value="ADMIN">ADMIN (Operational Assistant)</option>
              </select>
              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Creating Employee..."
                : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team Members List Card */}
      <Card className="border-border/40 md:col-span-7">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Firm Team Members
            </CardTitle>
            <CardDescription>
              All employees registered under your firm account
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No team members registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Created {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        member.role === "OWNER"
                          ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                          : member.role === "ADMIN"
                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
