"use client";

import {
  DollarSign, Users, Building, CheckSquare,
  TrendingUp, Target, Trophy, Activity,
  BarChart3, PieChart, Zap, Calendar,
} from "lucide-react";
import type { TileType, TileIcon, GlowVariant, ValueFormat, TimeGrouping } from "@/types/dashboard";

type Props = {
  tileType: TileType;
  title: string;
  icon: TileIcon;
  glow: GlowVariant;
  format: ValueFormat;
  subtitle: string;
  gridW: number;
  gridH: number;
  timeGrouping: TimeGrouping | undefined;
  comparisonPeriod: "previous_period" | "none";
  onTitleChange: (title: string) => void;
  onIconChange: (icon: TileIcon) => void;
  onGlowChange: (glow: GlowVariant) => void;
  onFormatChange: (format: ValueFormat) => void;
  onSubtitleChange: (subtitle: string) => void;
  onGridWChange: (w: number) => void;
  onGridHChange: (h: number) => void;
  onTimeGroupingChange: (grouping: TimeGrouping) => void;
  onComparisonChange: (comparison: "previous_period" | "none") => void;
};

const ICONS: { value: TileIcon; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "DollarSign", Icon: DollarSign },
  { value: "Users", Icon: Users },
  { value: "Building", Icon: Building },
  { value: "CheckSquare", Icon: CheckSquare },
  { value: "TrendingUp", Icon: TrendingUp },
  { value: "Target", Icon: Target },
  { value: "Trophy", Icon: Trophy },
  { value: "Activity", Icon: Activity },
  { value: "BarChart3", Icon: BarChart3 },
  { value: "PieChart", Icon: PieChart },
  { value: "Zap", Icon: Zap },
  { value: "Calendar", Icon: Calendar },
];

const GLOWS: { value: GlowVariant; label: string; color: string }[] = [
  { value: "violet", label: "Orange", color: "#F97316" },
  { value: "cyan", label: "Amber", color: "#FB923C" },
  { value: "success", label: "Green", color: "#10B981" },
  { value: "warning", label: "Yellow", color: "#F59E0B" },
  { value: "danger", label: "Red", color: "#F43F5E" },
];

const FORMATS: { value: ValueFormat; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency ($)" },
  { value: "percent", label: "Percent (%)" },
  { value: "days", label: "Days (d)" },
];

const SIZES: { w: number; h: number; label: string }[] = [
  { w: 3, h: 1, label: "Small" },
  { w: 4, h: 1, label: "Medium" },
  { w: 6, h: 1, label: "Wide" },
  { w: 6, h: 2, label: "Large" },
  { w: 12, h: 2, label: "Full" },
  { w: 12, h: 3, label: "XL" },
];

const TIME_GROUPINGS: { value: TimeGrouping; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
];

export function StepDisplay(props: Props) {
  const {
    tileType, title, icon, glow, format, subtitle, gridW, gridH,
    timeGrouping, comparisonPeriod,
    onTitleChange, onIconChange, onGlowChange, onFormatChange, onSubtitleChange,
    onGridWChange, onGridHChange, onTimeGroupingChange, onComparisonChange,
  } = props;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-primary">Display options</p>

      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-text-tertiary">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="focus-ring w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary outline-none"
        />
      </div>

      {/* KPI specific */}
      {tileType === "kpi" && (
        <>
          {/* Icon picker */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-tertiary">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(({ value, Icon }) => (
                <button
                  key={value}
                  onClick={() => onIconChange(value)}
                  className={`rounded-lg border p-2 transition-colors ${
                    icon === value
                      ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                      : "border-border-glass text-text-tertiary hover:bg-bg-elevated/30 hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Glow color */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-tertiary">Glow Color</label>
            <div className="flex gap-2">
              {GLOWS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => onGlowChange(g.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    glow === g.value ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: g.color }}
                />
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-tertiary">Value Format</label>
            <select
              value={format}
              onChange={(e) => onFormatChange(e.target.value as ValueFormat)}
              className="focus-ring w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary outline-none"
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Subtitle */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-tertiary">Subtitle (optional)</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => onSubtitleChange(e.target.value)}
              placeholder="e.g., Last 30 days"
              className="focus-ring w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>

          {/* Comparison */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-tertiary">Comparison</label>
            <select
              value={comparisonPeriod}
              onChange={(e) => onComparisonChange(e.target.value as "previous_period" | "none")}
              className="focus-ring w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary outline-none"
            >
              <option value="none">No comparison</option>
              <option value="previous_period">vs. previous period</option>
            </select>
          </div>
        </>
      )}

      {/* Chart specific: time grouping */}
      {tileType === "chart" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-text-tertiary">Time Grouping (for date group-by)</label>
          <select
            value={timeGrouping ?? "month"}
            onChange={(e) => onTimeGroupingChange(e.target.value as TimeGrouping)}
            className="focus-ring w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary outline-none"
          >
            {TIME_GROUPINGS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tile size */}
      <div>
        <label className="mb-1 block text-xs font-medium text-text-tertiary">Tile Size</label>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((size) => (
            <button
              key={`${size.w}x${size.h}`}
              onClick={() => { onGridWChange(size.w); onGridHChange(size.h); }}
              className={`flex flex-col items-center rounded-lg border px-3 py-2 text-xs transition-colors ${
                gridW === size.w && gridH === size.h
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-glass text-text-tertiary hover:bg-bg-elevated/30 hover:text-text-secondary"
              }`}
            >
              <div
                className="mb-1.5 rounded border border-current"
                style={{
                  width: `${Math.min(size.w * 6, 48)}px`,
                  height: `${size.h * 12}px`,
                }}
              />
              <span>{size.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
