"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomTable } from "@/components/ui/table";
import type { ColumnConfig } from "@/types/tableTypes";
import type { Lead } from "@/types/clientTypes";
import { Calendar, Inbox, UserPlus } from "lucide-react";

const STATUS_VARIANT: Record<
  Lead["status"],
  "emerald" | "destructive" | "amber" | "outline" | "navy"
> = {
  NEW: "outline",
  CONTACTED: "navy",
  QUALIFIED: "amber",
  CONVERTED: "emerald",
  REJECTED: "destructive",
  ARCHIVED: "destructive"
};

const CONVERTIBLE_STATUSES: Lead["status"][] = ["NEW", "CONTACTED", "QUALIFIED"];

interface LeadsTableProps {
  data: Lead[];
  isLoading: boolean;
  canManage: boolean;
  onStatusChange: (lead: Lead, status: string) => void;
  onConvert: (lead: Lead) => void;
}

export function LeadsTable({
  data,
  isLoading,
  canManage,
  onStatusChange,
  onConvert
}: Readonly<LeadsTableProps>) {
  const columns: ColumnConfig<Lead>[] = [
    {
      key: "name",
      header: "LEAD NAME",
      width: "24%",
      sortable: true,
      accessor: (l) => l.name,
      render: (l) => (
        <div>
          <p className="font-extrabold text-foreground text-sm">{l.name}</p>
          {l.description && (
            <span className="text-xs text-muted-foreground block truncate max-w-60">
              {l.description}
            </span>
          )}
        </div>
      )
    },
    {
      key: "status",
      header: "STATUS",
      width: "16%",
      sortable: true,
      accessor: (l) => l.status,
      render: (l) =>
        canManage ? (
          <select
            aria-label={`Change status for ${l.name}`}
            value={l.status}
            onChange={(e) => onStatusChange(l, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs h-7 px-2 rounded-lg border border-border bg-card text-foreground font-bold outline-none focus:border-primary cursor-pointer"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        ) : (
          <Badge
            variant={STATUS_VARIANT[l.status]}
            className="text-xs font-bold"
          >
            {l.status}
          </Badge>
        )
    },
    {
      key: "practiceArea",
      header: "AREA",
      width: "13%",
      sortable: true,
      accessor: (l) => l.practiceArea ?? "",
      render: (l) =>
        l.practiceArea ? (
          <Badge variant="navy" className="text-[10px] font-bold uppercase">
            {l.practiceArea}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
    },
    {
      key: "source",
      header: "SOURCE",
      width: "11%",
      sortable: true,
      accessor: (l) => l.source,
      render: (l) => (
        <span className="text-sm font-semibold text-muted-foreground uppercase">
          {l.source}
        </span>
      )
    },
    {
      key: "assignedTo",
      header: "ASSIGNED",
      width: "13%",
      accessor: (l) => l.assignedTo?.fullName ?? "",
      render: (l) => (
        <span className="text-sm font-semibold text-muted-foreground truncate block">
          {l.assignedTo?.fullName || "Unassigned"}
        </span>
      )
    },
    {
      key: "createdAt",
      header: "CREATED",
      width: "12%",
      sortable: true,
      accessor: (l) => new Date(l.createdAt),
      render: (l) => (
        <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-primary/70" />
          {new Date(l.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "actions",
      header: "ACTIONS",
      width: "11%",
      align: "center",
      render: (l) => {
        const convertible =
          canManage &&
          CONVERTIBLE_STATUSES.includes(l.status) &&
          !l.convertedToClientId;
        return (
          <div className="text-center">
            {convertible ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 font-bold gap-1 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  onConvert(l);
                }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Convert
              </Button>
            ) : l.convertedToClient ? (
              <Badge variant="emerald" className="text-[10px]">
                {l.convertedToClient.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      rowKey={(l) => l.id}
      isLoading={isLoading}
      loadingLabel="Loading intake pipeline..."
      emptyIcon={<Inbox className="h-12 w-12 text-muted-foreground/60 mx-auto" />}
      emptyTitle="No leads found"
      emptyDescription="Capture a new lead or adjust the status filter."
      caption="Leads list"
      pageSize={8}
    />
  );
}
