"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, Users, Building, CheckSquare,
  TrendingUp, Target, Trophy, Activity,
  BarChart3, PieChart, Zap, Calendar,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { AnimatedCounter } from "@/components/reports/animated-counter";
import { computeTileData } from "@/actions/dashboard";
import type { DashboardTile, KPITileConfig, KPITileData, TileIcon } from "@/types/dashboard";

const ICON_MAP: Record<TileIcon, React.ComponentType<{ className?: string }>> = {
  DollarSign, Users, Building, CheckSquare,
  TrendingUp, Target, Trophy, Activity,
  BarChart3, PieChart, Zap, Calendar,
};

type Props = {
  tile: DashboardTile;
};

export function KPITile({ tile }: Props) {
  const config = tile.config as KPITileConfig;
  const [data, setData] = useState<KPITileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      const result = await computeTileData({
        tile_type: "kpi",
        config,
      });
      if (!cancelled && result.success && result.data) {
        setData(result.data as KPITileData);
      }
      if (!cancelled) setLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [tile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const IconComponent = ICON_MAP[config.icon] ?? BarChart3;

  // Compute percentage change
  let changePercent: number | null = null;
  if (data?.previousValue !== undefined && data.previousValue > 0) {
    changePercent = Math.round(((data.value - data.previousValue) / data.previousValue) * 100);
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col justify-center">
        <div className="skeleton-shimmer mb-2 h-3 w-24 rounded bg-bg-card" />
        <div className="skeleton-shimmer h-8 w-32 rounded bg-bg-card" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {tile.title}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-elevated/50">
          <IconComponent className="h-4 w-4 text-accent-primary" />
        </div>
      </div>

      <div>
        <AnimatedCounter
          value={data?.value ?? 0}
          format={config.format}
          className="text-2xl font-bold text-text-primary"
        />

        <div className="mt-1 flex items-center gap-2">
          {config.subtitle && (
            <span className="text-xs text-text-tertiary">{config.subtitle}</span>
          )}
          {changePercent !== null && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                changePercent >= 0 ? "text-signal-success" : "text-signal-danger"
              }`}
            >
              {changePercent >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(changePercent)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
