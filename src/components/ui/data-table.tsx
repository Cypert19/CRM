"use client";

import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useDevice } from "@/components/providers/mobile-provider";
import type { SortConfig } from "@/types/common";

type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  sortConfig?: SortConfig;
  onSort?: (column: string) => void;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  /** Optional mobile card renderer — when provided, renders cards instead of table rows on mobile */
  mobileCardRender?: (row: T) => React.ReactNode;
};

function DataTable<T>({
  data,
  columns,
  sortConfig,
  onSort,
  onRowClick,
  keyExtractor,
  emptyMessage = "No data",
  className,
  mobileCardRender,
}: DataTableProps<T>) {
  const { isMobile } = useDevice();

  // Mobile card view
  if (isMobile && mobileCardRender) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.length === 0 ? (
          <div className="glass-panel rounded-2xl py-12 text-center text-sm text-text-tertiary">
            {emptyMessage}
          </div>
        ) : (
          data.map((row) => (
            <div
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(onRowClick && "cursor-pointer")}
            >
              {mobileCardRender(row)}
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("glass-panel overflow-hidden rounded-2xl", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-glass">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-text-tertiary",
                    col.sortable && "cursor-pointer select-none hover:text-text-secondary",
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig?.column === col.key ? (
                      sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : col.sortable ? (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-sm text-text-tertiary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    "border-b border-border-subtle transition-colors hover:bg-bg-card/30",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-sm", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable, type Column };
