"use client";

import { useEffect, useState } from "react";
import { computeTileData } from "@/actions/dashboard";
import type { DashboardTile, TableTileConfig, TableTileData, TableTileColumn } from "@/types/dashboard";

type Props = {
  tile: DashboardTile;
};

function formatCellValue(value: unknown, column: TableTileColumn): string {
  if (value === null || value === undefined) return "—";

  switch (column.type) {
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);
    case "date": {
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    }
    default:
      return String(value);
  }
}

function BadgeCell({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    // Task status
    "To Do": "bg-text-tertiary/20 text-text-secondary",
    "In Progress": "bg-accent-primary/20 text-accent-primary",
    "Done": "bg-signal-success/20 text-signal-success",
    "Cancelled": "bg-signal-danger/20 text-signal-danger",
    // Priority
    "Low": "bg-text-tertiary/20 text-text-secondary",
    "Medium": "bg-signal-warning/20 text-signal-warning",
    "High": "bg-accent-primary/20 text-accent-primary",
    "Urgent": "bg-signal-danger/20 text-signal-danger",
    "Critical": "bg-signal-danger/20 text-signal-danger",
    // Lifecycle
    "Lead": "bg-text-tertiary/20 text-text-secondary",
    "Customer": "bg-signal-success/20 text-signal-success",
    "Opportunity": "bg-accent-primary/20 text-accent-primary",
  };

  const colors = colorMap[value] ?? "bg-bg-elevated text-text-secondary";

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${colors}`}>
      {value}
    </span>
  );
}

export function TableTile({ tile }: Props) {
  const config = tile.config as TableTileConfig;
  const [data, setData] = useState<TableTileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      const result = await computeTileData({
        tile_type: "table",
        config,
      });
      if (!cancelled && result.success && result.data) {
        setData(result.data as TableTileData);
      }
      if (!cancelled) setLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [tile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="skeleton-shimmer mb-3 h-3 w-32 rounded bg-bg-card" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer mb-2 h-6 rounded bg-bg-card" />
        ))}
      </div>
    );
  }

  const columns = data?.columns ?? [];
  const rows = data?.rows ?? [];

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs font-semibold text-text-primary">{tile.title}</p>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-text-tertiary">
          No data available
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="pb-2 pr-4 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border-subtle/50">
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 pr-4 text-xs text-text-secondary">
                      {col.type === "badge" ? (
                        <BadgeCell value={String(row[col.key] ?? "")} />
                      ) : (
                        <span className="block max-w-[200px] truncate">
                          {formatCellValue(row[col.key], col)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
