"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Scale
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

// Matches the Matter shape used in MattersList
export interface Matter {
  id: string;
  firmCaseNumber: string;
  courtCaseNumber?: string | null;
  cnr?: string | null;
  caseType:
    | "CIVIL"
    | "CRIMINAL"
    | "WRIT"
    | "FAMILY"
    | "SERVICE"
    | "CORPORATE"
    | "TAXATION";
  court?: string | null;
  bench?: string | null;
  presidingJudge?: string | null;
  currentStageId?: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DECIDED" | "CLOSED";
  filingDate?: string | null;
  clientName: string;
  createdAt: string;
  updatedAt: string;
  currentStage?: {
    id: string;
    name: string;
    sequenceOrder: number;
  } | null;
  associates: Array<{
    id: string;
    associateId: string;
    role?: string | null;
  }>;
}

interface MattersTableProps {
  data: Matter[];
  isLoading: boolean;
}

export function MattersTable({ data, isLoading }: Readonly<MattersTableProps>) {
  const columns = useMemo<ColumnDef<Matter>[]>(
    () => [
      {
        accessorKey: "firmCaseNumber",
        header: "CASE REFERENCE",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div>
              <p className="font-extrabold text-foreground text-sm">
                {m.firmCaseNumber}
              </p>
              {m.courtCaseNumber && (
                <span className="text-xs text-muted-foreground block truncate max-w-45">
                  Court Case: {m.courtCaseNumber}
                </span>
              )}
              {m.cnr && (
                <span className="text-xs font-mono text-primary bg-primary/5 px-1 py-0.5 rounded border border-primary/10 inline-block mt-0.5">
                  CNR: {m.cnr}
                </span>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: "clientName",
        header: "CLIENT NAME",
        cell: ({ row }) => (
          <span className="font-bold text-foreground text-sm">
            {row.original.clientName}
          </span>
        )
      },
      {
        accessorKey: "caseType",
        header: "CASE TYPE",
        cell: ({ row }) => (
          <Badge variant="navy" className="text-xs font-bold uppercase">
            {row.original.caseType}
          </Badge>
        )
      },
      {
        accessorKey: "currentStage",
        header: "CURRENT STAGE",
        cell: ({ row }) => {
          const stage = row.original.currentStage;
          return (
            <span className="text-sm font-semibold text-muted-foreground truncate max-w-[200px] block">
              {stage ? stage.name : "None / Unassigned"}
            </span>
          );
        }
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
          const status = row.original.status;
          let variant: "emerald" | "destructive" | "amber" | "outline" =
            "outline";
          if (status === "ACTIVE") variant = "emerald";
          else if (status === "DECIDED") variant = "amber";
          else if (status === "CLOSED" || status === "ARCHIVED")
            variant = "destructive";

          return (
            <Badge variant={variant} className="text-xs font-bold">
              {status}
            </Badge>
          );
        }
      },
      {
        accessorKey: "filingDate",
        header: "FILING DATE",
        cell: ({ row }) => {
          const d = row.original.filingDate;
          return (
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary/70" />
              {d ? new Date(d).toLocaleDateString() : "Not Filed"}
            </span>
          );
        }
      },
      {
        id: "actions",
        header: () => <div className="text-center">ACTIONS</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <Link href={`/matters/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-sm text-primary hover:text-primary hover:bg-primary/10 font-bold gap-1 rounded-xl"
              >
                <span>View Details</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
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
    <Card className="overflow-hidden bg-card text-card-foreground">
      <div className="overflow-x-auto">
        {!isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">
              Loading legal ledger...
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center p-16 space-y-2">
            <Scale className="h-12 w-12 text-muted-foreground/60 mx-auto" />
            <p className="font-bold text-foreground text-base">
              No matters found
            </p>
            <p className="text-sm text-muted-foreground">
              Adjust filters or create a new matter to begin.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-border hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground h-10 px-4"
                    >
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
                  className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => {
                    window.location.href = `/matters/${row.original.id}`;
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 align-middle text-sm"
                    >
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
        )}
      </div>

      {/* Pagination controls */}
      {!isLoading && data.length > 0 && (
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
          <span className="text-sm font-semibold text-muted-foreground">
            Showing page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 w-7 p-0 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 w-7 p-0 rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
