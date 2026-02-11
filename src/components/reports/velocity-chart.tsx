"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { AnimatedCounter } from "./animated-counter";
import type { DealVelocityData } from "@/actions/reports";
import { Zap } from "lucide-react";

type Props = {
  data: DealVelocityData;
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
          <span className="font-medium text-text-primary">
            {entry.name === "Avg Days" ? `${entry.value}d` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VelocityChart({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <GlassCard>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Deal Velocity</h3>
            <p className="text-xs text-text-tertiary">Average time to close deals</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-bg-elevated/50 px-4 py-2">
            <Zap className="h-4 w-4 text-signal-warning" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Avg. Close Time</p>
              <AnimatedCounter
                value={data.avg_days_to_close}
                format="days"
                className="text-lg font-bold text-text-primary"
              />
            </div>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data.monthly_velocity}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradVelocityBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6B6B80", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#6B6B80", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#6B6B80", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={(v) => `${v}d`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#A0A0B8" }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                yAxisId="left"
                dataKey="deals_closed"
                name="Deals Closed"
                fill="url(#gradVelocityBar)"
                radius={[6, 6, 0, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
                barSize={32}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_days"
                name="Avg Days"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "#F59E0B",
                  stroke: "#1A1A2E",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#F59E0B",
                  stroke: "#1A1A2E",
                  strokeWidth: 3,
                }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </motion.div>
  );
}
