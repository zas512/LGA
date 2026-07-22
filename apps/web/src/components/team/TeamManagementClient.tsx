"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { UserPlus, Shield, Users, RefreshCw } from "lucide-react";

const createMemberSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(["ADMIN", "ASSOCIATE"], {
    error: () => ({ message: "Role must be ADMIN or ASSOCIATE" })
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

function getRoleBadgeVariant(role: string): "navy" | "secondary" | "outline" {
  if (role === "OWNER") {
    return "navy";
  }
  if (role === "ADMIN") {
    return "secondary";
  }
  return "outline";
}

export function TeamManagementClient() {
  const queryClient = useQueryClient();

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
      toast.success("Employee account created successfully.");
      reset();
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create employee");
    }
  });

  function onSubmit(values: CreateMemberValues) {
    createMutation.mutate(values);
  }

  const renderRosterContent = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center text-xs text-muted-foreground font-medium">
          Loading firm roster...
        </div>
      );
    }

    if (teamMembers.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-muted-foreground font-medium">
          No team members registered yet.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>EMPLOYEE EMAIL</TableHead>
            <TableHead>CREATED DATE</TableHead>
            <TableHead className="text-right">ROLE</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-bold text-foreground">
                {member.email}
              </TableCell>
              <TableCell className="text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-primary" />
                  {new Date(member.createdAt).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {member.role}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* Create Member Form Card */}
      <Card className="md:col-span-5 border-border bg-card text-card-foreground shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create Firm Employee
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Register a new associate or admin under your firm. All created
            employees share your firm identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold">
                Employee Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@laalglobal.com"
                {...register("email")}
                disabled={createMutation.isPending}
                className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-xl"
              />
              {errors.email && (
                <p className="text-xs text-destructive font-semibold">
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
                className="bg-card border-border text-foreground focus-visible:ring-primary/40 rounded-xl"
              />
              {errors.password && (
                <p className="text-xs text-destructive font-semibold">
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
                className="w-full h-10 rounded-xl border border-input bg-card text-foreground px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ASSOCIATE">ASSOCIATE (Legal Associate)</option>
                <option value="ADMIN">ADMIN (Operational Assistant)</option>
              </select>
              {errors.role && (
                <p className="text-xs text-destructive font-semibold">
                  {errors.role.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl mt-2"
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
      <Card className="md:col-span-7 border-border bg-card text-card-foreground shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Firm Team Roster
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              All active associates and staff under your firm tenant
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin text-primary" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>{renderRosterContent()}</CardContent>
      </Card>
    </div>
  );
}
