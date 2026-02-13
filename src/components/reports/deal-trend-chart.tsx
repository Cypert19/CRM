"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { DealTrend } from "@/actions/reports";

type Props = {
  data: DealTrend[];
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl border border-white/10 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-medium text-text-primary">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DealTrendChart({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Deal Flow</h3>
            <p className="text-xs text-text-tertiary">Deals created, won & lost over time</p>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradWon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#737373", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#737373", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#A0A0A0" }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="created"
                name="Created"
                stroke="#F97316"
                strokeWidth={2.5}
                fill="url(#gradCreated)"
                animationDuration={1500}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#F97316",
                  stroke: "#1C1C1C",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="won"
                name="Won"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#gradWon)"
                animationDuration={1800}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#10B981",
                  stroke: "#1C1C1C",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="lost"
                name="Lost"
                stroke="#F43F5E"
                strokeWidth={2}
                fill="url(#gradLost)"
                animationDuration={2100}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#F43F5E",
                  stroke: "#1C1C1C",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </motion.div>
  );
}
