"use client";

import { TrendingUp, TrendingDown, Minus, DollarSign, Trophy, XCircle, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency, formatCompactNumber } from "@/lib/utils";

const iconMap = {
  DollarSign,
  Trophy,
  XCircle,
  Clock,
} as const;

type KPICardProps = {
  label: string;
  value: number;
  format?: "currency" | "number" | "days";
  trend?: number;
  trendLabel?: string;
  glowColor?: "violet" | "success" | "danger" | "cyan";
  icon: keyof typeof iconMap;
};

export function KPICard({
  label,
  value,
  format = "number",
  trend,
  trendLabel,
  glowColor = "violet",
  icon,
}: KPICardProps) {
  const Icon = iconMap[icon];
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "days"
        ? `${value}d`
        : formatCompactNumber(value);

  const trendColor =
    trend === undefined || trend === 0
      ? "text-text-tertiary"
      : trend > 0
        ? "text-signal-success"
        : "text-signal-danger";

  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown;

  return (
    <GlassCard
      glow={glowColor}
      className="group transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <Icon className="h-4 w-4 text-text-tertiary" />
      </div>
      <p className="mt-2 font-mono text-3xl font-bold text-text-primary">
        {formattedValue}
      </p>
      {trend !== undefined && (
        <div className={cn("mt-2 flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(trend)}%</span>
          {trendLabel && (
            <span className="text-text-tertiary">{trendLabel}</span>
          )}
        </div>
      )}
    </GlassCard>
  );
}
