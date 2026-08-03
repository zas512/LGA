import type { ReactNode } from "react";
type AlignType = "left" | "center" | "right";

export interface ColumnConfig<T> {
  key: string;
  header: string;
  width?: string;
  align?: AlignType;
  sortable?: boolean;
  accessor?: (row: T) => string | number | Date | null | undefined;
  render?: (row: T) => ReactNode;
  sortFn?: (a: T, b: T) => number;
}

type SortDirection = "asc" | "desc" | null;

export interface SortState {
  key: string | null;
  direction: SortDirection;
}

export interface CustomTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  onColumnOrderChange?: (orderedKeys: string[]) => void;
}
