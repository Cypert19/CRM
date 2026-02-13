"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MonthlyRevenueData } from "@/actions/reports";

type Props = {
  data: MonthlyRevenueData[];
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="glass-panel rounded-xl border border-white/10 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-medium text-text-primary">
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
      <div className="mt-1.5 border-t border-white/10 pt-1.5 text-xs">
        <span className="text-text-secondary">Total:</span>{" "}
        <span className="font-semibold text-text-primary">${total.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function MonthlyRevenueChart({ data }: Props) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Monthly Revenue</h3>
            <p className="text-xs text-text-tertiary">
              Revenue recognized per month across won deals (last 12 months)
            </p>
          </div>
        </div>

        {hasData ? (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#A0A0A0" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="retainer"
                  name="Retainer"
                  stackId="revenue"
                  fill="#10B981"
                  radius={[0, 0, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="audit_fee"
                  name="Audit Fee"
                  stackId="revenue"
                  fill="#F59E0B"
                  radius={[0, 0, 0, 0]}
                  animationDuration={1800}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="custom_dev_fee"
                  name="Custom Dev"
                  stackId="revenue"
                  fill="#F97316"
                  radius={[4, 4, 0, 0]}
                  animationDuration={2100}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-text-tertiary">
              No monthly revenue data yet. Set revenue start dates on won deals to see data here.
            </p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
