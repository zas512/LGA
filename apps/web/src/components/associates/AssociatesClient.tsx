"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef
} from "@tanstack/react-table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  UserPlus,
  Shield,
  Users,
  RefreshCw,
  Search,
  Calendar,
  Crown,
  Eye,
  Building2,
  Mail
} from "lucide-react";

// Validation Schema for creating a User / Associate under the firm
const createMemberSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.email({ message: "Valid email address is required" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(["ASSOCIATE", "ADMIN"], {
    error: () => ({ message: "Role must be ASSOCIATE or ADMIN" })
  })
});

type CreateMemberValues = z.infer<typeof createMemberSchema>;

interface FirmMember {
  id: string;
  email: string;
  name?: string | null;
  mustChangePassword?: boolean;
  role: "OWNER" | "ADMIN" | "ASSOCIATE" | "SUPER_ADMIN";
  firmId: string | null;
  isActive: boolean;
  createdAt: string;
  firm?: {
    id: string;
    name: string;
  } | null;
}

interface AssociatesClientProps {
  userRole: string;
}

function getBadgeVariant(role: string): "navy" | "secondary" | "outline" {
  if (role === "OWNER") return "navy";
  if (role === "ADMIN") return "secondary";
  return "outline";
}

export function AssociatesClient({
  userRole
}: Readonly<AssociatesClientProps>) {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FirmMember | null>(null);

  const canManage = userRole === "OWNER" || userRole === "ADMIN";

  // Fetch all firm members (Users having the same firmId)
  const {
    data: allMembers = [],
    isLoading,
    isRefetching,
    refetch,
    error
  } = useQuery<FirmMember[]>({
    queryKey: ["associates"],
    queryFn: async () => {
      console.log("[CLIENT useQuery] Fetching GET /api/associates...");
      const res = await fetch("/api/associates");
      console.log(
        "[CLIENT useQuery] GET /api/associates response status:",
        res.status
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[CLIENT useQuery] Error response:", errorData);
        throw new Error(errorData.message || "Failed to fetch firm members");
      }
      const data = await res.json();
      console.log(`[CLIENT useQuery] Received ${data?.length} members:`, data);
      return data;
    }
  });

  useEffect(() => {
    if (error) {
      toast.error(`Error loading firm roster: ${error.message}`);
    }
  }, [error]);

  // Extract Firm Owner(s) and staff members
  const ownerMember = useMemo(
    () => allMembers.find((m) => m.role === "OWNER") || null,
    [allMembers]
  );

  const tableMembers = useMemo(
    () => allMembers.filter((m) => m.role !== "OWNER"),
    [allMembers]
  );

  // Form for creating new associate/user
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateMemberValues>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "ASSOCIATE"
    }
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateMemberValues) => {
      console.log(
        "[CLIENT createMutation] Posting to /api/associates:",
        values
      );
      const res = await fetch("/api/associates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to create firm member");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Member account created successfully.");
      reset();
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["associates"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create firm member");
    }
  });

  function onSubmit(values: CreateMemberValues) {
    createMutation.mutate(values);
  }

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<FirmMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: "FULL NAME",
        cell: ({ row }) => {
          const member = row.original;
          const initials = member.name
            ? member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()
            : member.email.substring(0, 2).toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                {initials}
              </div>
              <p className="font-bold text-foreground leading-tight">
                {member.name || "N/A"}
              </p>
            </div>
          );
        }
      },
      {
        accessorKey: "email",
        header: "MEMBER EMAIL",
        cell: ({ row }) => {
          return (
            <span className="text-xs text-muted-foreground font-medium">
              {row.original.email}
            </span>
          );
        }
      },
      {
        accessorKey: "role",
        header: "ASSIGNED ROLE",
        cell: ({ row }) => {
          const role = row.original.role;
          return (
            <Badge
              variant={getBadgeVariant(role)}
              className="text-xs font-bold"
            >
              {role}
            </Badge>
          );
        }
      },
      {
        accessorKey: "isActive",
        header: "STATUS",
        cell: ({ row }) => {
          const active = row.original.isActive;
          return (
            <Badge
              variant={active ? "emerald" : "destructive"}
              className="text-[10px]"
            >
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        }
      },
      {
        accessorKey: "createdAt",
        header: "CREATED DATE",
        cell: ({ row }) => {
          const dateStr = row.original.createdAt;
          return (
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary/70" />
              {new Date(dateStr).toLocaleDateString()}
            </span>
          );
        }
      },
      {
        id: "actions",
        header: () => <div className="text-center">ACTIONS</div>,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMember(row.original);
                }}
                className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 font-bold gap-1 rounded-xl"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View</span>
              </Button>
            </div>
          );
        }
      }
    ],
    []
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: tableMembers,
    columns,
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* TOP SECTION: FIRM OWNER LEADERSHIP CARD */}
      {/* ========================================================= */}
      {ownerMember && (
        <Card className="border-border bg-card text-card-foreground shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center border border-primary/20 shadow-xs shrink-0">
                  {ownerMember.email.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold">
                      {ownerMember.email}
                    </CardTitle>
                    <Badge
                      variant="navy"
                      className="gap-1 font-extrabold text-xs"
                    >
                      <Crown className="h-3 w-3 text-amber-500" />
                      FIRM OWNER
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      {ownerMember.firm?.name || "Laal Global Advisory"}
                    </span>
                    <span>•</span>
                    <span>Managing Principal & Administrator</span>
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="emerald" className="text-xs">
                  Active Owner Account
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(ownerMember)}
                  className="rounded-xl text-xs font-bold border-border"
                >
                  View Owner Details
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Action Bar & Search */}
      <Card className="border-border bg-card text-card-foreground shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search associates & staff by email, role..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 bg-card border-border text-xs rounded-xl focus-visible:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="rounded-xl text-xs font-semibold border-border gap-1.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-primary" : ""}`}
              />
              <span>Refresh</span>
            </Button>

            {canManage && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold gap-1.5 h-9 px-4 shadow-xs"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Associate</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* ASSOCIATES & STAFF TANSTACK DATA TABLE */}
      {/* ========================================================= */}
      <Card className="border-border bg-card text-card-foreground shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Firm Associates & Roster
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {tableMembers.length} enrolled staff members registered under firm
            </CardDescription>
          </div>
          <Badge variant="navy" className="text-xs">
            {tableMembers.filter((m) => m.isActive).length} Active Staff
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-medium">
              Loading firm members...
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-medium">
              No staff or associate records found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => setSelectedMember(row.original)}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Table Pagination Bar */}
              <div className="flex items-center justify-between p-4 border-t border-border/60 text-xs text-muted-foreground">
                <span>
                  Showing Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 text-xs rounded-xl"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 text-xs rounded-xl"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* CREATE ASSOCIATE DIALOG (MODAL WITH REQUIRED RED STARS *) */}
      {/* ========================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create Associate Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register a new associate or admin under your firm. Mandatory
              fields are marked with a red star (
              <span className="text-destructive font-bold">*</span>).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Full Name * */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-bold text-foreground"
              >
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
                className="bg-card text-xs rounded-xl"
              />
              {errors.name && (
                <p className="text-[11px] text-destructive font-semibold">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Address * */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-bold text-foreground"
              >
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="associate@laalglobal.com"
                {...register("email")}
                className="bg-card text-xs rounded-xl"
              />
              {errors.email && (
                <p className="text-[11px] text-destructive font-semibold">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password * */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-bold text-foreground"
              >
                Account Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register("password")}
                className="bg-card text-xs rounded-xl"
              />
              {errors.password && (
                <p className="text-[11px] text-destructive font-semibold">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role * */}
            <div className="space-y-1.5">
              <Label
                htmlFor="role"
                className="text-xs font-bold text-foreground"
              >
                Assigned Role <span className="text-destructive">*</span>
              </Label>
              <select
                id="role"
                {...register("role")}
                className="w-full h-9 rounded-xl border border-input bg-card text-foreground px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ASSOCIATE">ASSOCIATE (Legal Counsel)</option>
                <option value="ADMIN">ADMIN (Operations Assistant)</option>
              </select>
              {errors.role && (
                <p className="text-[11px] text-destructive font-semibold">
                  {errors.role.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl"
              >
                {createMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* VIEW MEMBER DETAILS DIALOG */}
      {/* ========================================================= */}
      <Dialog
        open={Boolean(selectedMember)}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      >
        <DialogContent className="max-w-md">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 pb-2">
                  <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center border border-primary/20 shadow-xs">
                    {selectedMember.name
                      ? selectedMember.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : selectedMember.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">
                      {selectedMember.name || selectedMember.email}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>Role: {selectedMember.role}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        {selectedMember.firm?.name || "Laal Global Advisory"}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {selectedMember.name && (
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 col-span-2">
                      <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        Full Name
                      </p>
                      <p className="font-bold text-foreground truncate mt-1">
                        {selectedMember.name}
                      </p>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                    <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      Email Address
                    </p>
                    <p className="font-bold text-foreground truncate mt-1">
                      {selectedMember.email}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                    <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      System Role
                    </p>
                    <p className="font-bold text-foreground mt-1">
                      {selectedMember.role}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                    <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Created Date
                    </p>
                    <p className="font-bold text-foreground mt-1">
                      {new Date(selectedMember.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                    <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Account Status
                    </p>
                    <p className="font-bold text-emerald-600 mt-1">
                      {selectedMember.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                    <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      Password Status
                    </p>
                    <p className="font-bold text-foreground mt-1">
                      {selectedMember.mustChangePassword
                        ? "Pending Reset"
                        : "Set by User"}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
