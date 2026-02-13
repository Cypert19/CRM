"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AnimatedCounter } from "./animated-counter";
import type { WinLossData } from "@/actions/reports";

type Props = {
  data: WinLossData;
};

const DONUT_COLORS = ["#10B981", "#F43F5E", "#F97316"];

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl border border-white/10 px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2 text-xs">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
        <span className="text-text-secondary">{payload[0].name}:</span>
        <span className="font-bold text-text-primary">{payload[0].value}</span>
      </div>
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
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

export function WinLossChart({ data }: Props) {
  const donutData = [
    { name: "Won", value: data.won_deals },
    { name: "Lost", value: data.lost_deals },
    { name: "Open", value: data.open_deals },
  ].filter((d) => d.value > 0);

  const hasData = data.total_deals > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Win Rate Donut */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <GlassCard className="h-full">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Win Rate</h3>
            <p className="text-xs text-text-tertiary">Overall deal outcome distribution</p>
          </div>

          {hasData ? (
            <div className="flex items-center gap-6">
              <div className="relative h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={1500}
                      animationEasing="ease-out"
                      stroke="none"
                    >
                      {donutData.map((_, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatedCounter
                    value={data.win_rate}
                    format="percent"
                    className="text-2xl font-bold text-text-primary"
                  />
                  <span className="text-[10px] text-text-tertiary">Win Rate</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-signal-success" />
                    <span className="text-xs text-text-secondary">Won</span>
                  </div>
                  <p className="ml-[18px] text-lg font-bold text-text-primary">{data.won_deals}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-signal-danger" />
                    <span className="text-xs text-text-secondary">Lost</span>
                  </div>
                  <p className="ml-[18px] text-lg font-bold text-text-primary">{data.lost_deals}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-accent-primary" />
                    <span className="text-xs text-text-secondary">Open</span>
                  </div>
                  <p className="ml-[18px] text-lg font-bold text-text-primary">{data.open_deals}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[180px] items-center justify-center">
              <p className="text-sm text-text-tertiary">No deals to display</p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* By Source */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <GlassCard className="h-full">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Outcomes by Source</h3>
            <p className="text-xs text-text-tertiary">Win/loss breakdown by deal source</p>
          </div>

          {data.by_source.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.by_source}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#737373", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    tick={{ fill: "#A0A0A0", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar
                    dataKey="won"
                    name="Won"
                    fill="#10B981"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="lost"
                    name="Lost"
                    fill="#F43F5E"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-text-tertiary">No source data available</p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
