"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { computeTileData } from "@/actions/dashboard";
import type { DashboardTile, ChartTileConfig, ChartTileData } from "@/types/dashboard";

const DEFAULT_COLORS = ["#F97316", "#FB923C", "#10B981", "#F43F5E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

type Props = {
  tile: DashboardTile;
};

function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl border border-white/10 px-4 py-3 shadow-xl">
      {label && <p className="mb-2 text-xs font-medium text-text-primary">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium text-text-primary">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartTile({ tile }: Props) {
  const config = tile.config as ChartTileConfig;
  const [data, setData] = useState<ChartTileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      const result = await computeTileData({
        tile_type: "chart",
        config,
      });
      if (!cancelled && result.success && result.data) {
        setData(result.data as ChartTileData);
      }
      if (!cancelled) setLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [tile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const chartHeight = tile.grid_h === 1 ? 80 : tile.grid_h === 2 ? 200 : 340;

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="skeleton-shimmer mb-4 h-3 w-32 rounded bg-bg-card" />
        <div className="skeleton-shimmer flex-1 rounded bg-bg-card" />
      </div>
    );
  }

  const points = data?.points ?? [];

  if (points.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <p className="mb-2 text-xs font-medium text-text-tertiary">{tile.title}</p>
        <div className="flex flex-1 items-center justify-center text-xs text-text-tertiary">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs font-semibold text-text-primary">{tile.title}</p>

      <div className="flex-1" style={{ minHeight: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {config.chartType === "pie" ? (
            <PieChart>
              <Pie
                data={points}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={tile.grid_h >= 2 ? 40 : 20}
                outerRadius={tile.grid_h >= 2 ? 70 : 35}
                paddingAngle={2}
                stroke="none"
                animationDuration={1500}
              >
                {points.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
            </PieChart>
          ) : config.chartType === "area" ? (
            <AreaChart data={points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${tile.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[0]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<GlassTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                fill={`url(#grad-${tile.id})`}
                animationDuration={1500}
                dot={false}
                activeDot={{ r: 4, fill: colors[0], stroke: "#1C1C1C", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : config.chartType === "line" ? (
            <LineChart data={points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<GlassTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: colors[0], stroke: "#1C1C1C", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: colors[0], stroke: "#1C1C1C", strokeWidth: 2 }}
                animationDuration={1500}
              />
            </LineChart>
          ) : (
            <BarChart data={points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<GlassTooltip />} />
              <Bar
                dataKey="value"
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
