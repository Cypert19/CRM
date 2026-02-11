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
} from "recharts";
import type { DealTrend } from "@/actions/reports";

type Props = {
  data: DealTrend[];
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const formatted = val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`;
  return (
    <div className="glass-panel rounded-xl border border-white/10 px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-text-primary">{label}</p>
      <p className="mt-1 text-sm font-bold text-accent-cyan">{formatted}</p>
    </div>
  );
}

export function PipelineValueChart({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <GlassCard>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Pipeline Value Over Time</h3>
          <p className="text-xs text-text-tertiary">Monthly deal value created</p>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPipelineValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
                <filter id="glowCyan">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6B6B80", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B6B80", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="pipeline_value"
                stroke="#06B6D4"
                strokeWidth={3}
                fill="url(#gradPipelineValue)"
                filter="url(#glowCyan)"
                animationDuration={2000}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#06B6D4",
                  stroke: "#1A1A2E",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </motion.div>
  );
}
