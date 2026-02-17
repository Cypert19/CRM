"use client";

import { BarChart3, Hash, Table2 } from "lucide-react";
import type { TileType } from "@/types/dashboard";

type Props = {
  value: TileType;
  onChange: (type: TileType) => void;
};

const TILE_TYPES: { type: TileType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: "kpi",
    label: "KPI Metric",
    description: "A single number — count, sum, average, etc.",
    icon: <Hash className="h-6 w-6" />,
  },
  {
    type: "chart",
    label: "Chart",
    description: "Bar, line, area, or pie chart visualization.",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    type: "table",
    label: "Data Table",
    description: "A compact table of filtered entity records.",
    icon: <Table2 className="h-6 w-6" />,
  },
];

export function StepTileType({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-text-primary">Choose tile type</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TILE_TYPES.map((tt) => (
          <button
            key={tt.type}
            onClick={() => onChange(tt.type)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
              value === tt.type
                ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                : "border-border-glass text-text-secondary hover:border-border-glass hover:bg-bg-elevated/30 hover:text-text-primary"
            }`}
          >
            {tt.icon}
            <span className="text-xs font-medium">{tt.label}</span>
            <span className="text-[10px] text-text-tertiary">{tt.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
