"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Client } from "@/types/clientTypes";
import {
  Building2,
  Contact,
  Plus,
  Search,
  ShieldAlert,
  User,
  UserCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClientDetailDialog } from "./ClientDetailDialog";
import { ClientsTable } from "./ClientsTable";
import { ConflictCheckDialog } from "./ConflictCheckDialog";
import { CreateClientDialog } from "./CreateClientDialog";

interface ClientsClientProps {
  userRole: string;
}

export function ClientsClient({ userRole }: Readonly<ClientsClientProps>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);
  const canManage = userRole === "OWNER";

  const {
    data: allClients = [],
    isLoading,
    refetch,
    isRefetching,
    error
  } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch clients");
      }
      return res.json();
    }
  });

  useEffect(() => {
    if (error) {
      toast.error(`Error loading clients: ${error.message}`);
    }
  }, [error]);

  const filteredClients = useMemo(() => {
    return allClients.filter((c) => {
      const matchesStatus =
        statusFilter === "ALL" || c.status === statusFilter;
      const matchesType =
        typeFilter === "ALL" || c.clientType === typeFilter;

      const searchStr =
        `${c.name} ${c.contactPerson ?? ""} ${c.phone ?? ""} ${c.email ?? ""} ${c.cnic ?? ""}`.toLowerCase();
      const matchesSearch =
        !globalFilter || searchStr.includes(globalFilter.toLowerCase());

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [allClients, statusFilter, typeFilter, globalFilter]);

  const stats = useMemo(() => {
    const total = allClients.length;
    const active = allClients.filter((c) => c.status === "ACTIVE").length;
    const inactive = allClients.filter((c) => c.status === "INACTIVE").length;
    const companies = allClients.filter(
      (c) => c.clientType === "COMPANY" || c.clientType === "GOVERNMENT"
    ).length;
    return { total, active, inactive, companies };
  }, [allClients]);

  return (
    <div className="space-y-6">
      {/* 1. KPI Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="skeuo-card bg-card text-card-foreground">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Total Clients
              </p>
              <h2 className="text-2xl font-black mt-1 text-foreground">
                {stats.total}
              </h2>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Contact className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="skeuo-card bg-card text-card-foreground">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Active
              </p>
              <h2 className="text-2xl font-black mt-1 text-success">
                {stats.active}
              </h2>
            </div>
            <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center border border-success/20">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="skeuo-card bg-card text-card-foreground">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Inactive
              </p>
              <h2 className="text-2xl font-black mt-1 text-destructive">
                {stats.inactive}
              </h2>
            </div>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="skeuo-card bg-card text-card-foreground">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Companies
              </p>
              <h2 className="text-2xl font-black mt-1 text-warning">
                {stats.companies}
              </h2>
            </div>
            <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center border border-warning/20">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Action & Filter Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-full max-w-xs sm:w-80 h-10 flex items-center px-3 rounded-xl border border-border bg-card transition-colors hover:border-primary/70 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
            <Search className="size-5 text-muted-foreground" />
            <Input
              aria-label="Search clients"
              placeholder="Search name, CNIC, contact..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status" className="w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger aria-label="Filter by type" className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="COMPANY">Company</SelectItem>
              <SelectItem value="GOVERNMENT">Government</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsConflictOpen(true)}
                className="rounded-full h-10 text-sm font-semibold border-border"
              >
                <ShieldAlert className="size-5" />
                Conflict Check
              </Button>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-full text-sm font-bold h-10"
              >
                <Plus className="size-5" />
                New Client
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-full h-10 text-sm font-semibold dark:border-white/40 border-border"
          >
            Sync Ledger
          </Button>
        </div>
      </section>

      {/* 3. Table Ledger */}
      <ClientsTable
        data={filteredClients}
        isLoading={isLoading}
        onView={(c) => setViewingClientId(c.id)}
      />

      {/* 4. Dialogs */}
      {canManage && (
        <>
          <CreateClientDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
          />
          <ConflictCheckDialog
            open={isConflictOpen}
            onOpenChange={setIsConflictOpen}
            onProceed={() => setIsCreateOpen(true)}
          />
        </>
      )}
      <ClientDetailDialog
        clientId={viewingClientId}
        onOpenChange={(open) => {
          if (!open) setViewingClientId(null);
        }}
      />
    </div>
  );
}
