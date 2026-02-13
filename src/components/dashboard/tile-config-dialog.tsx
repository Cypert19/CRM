"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StepTileType } from "./tile-config-steps/step-tile-type";
import { StepDataSource } from "./tile-config-steps/step-data-source";
import { StepFilters } from "./tile-config-steps/step-filters";
import { StepDisplay } from "./tile-config-steps/step-display";
import { addTile, updateTile } from "@/actions/dashboard";
import type {
  DashboardTile, TileType, EntitySource, AggregationType, ChartType,
  TimeRange, TimeGrouping, TileFilter, TileIcon, GlowVariant, ValueFormat,
  KPITileConfig, ChartTileConfig, TableTileConfig,
} from "@/types/dashboard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: string;
  editingTile: DashboardTile | null;
  onSaved: () => void;
};

const STEPS = ["Type", "Data Source", "Filters", "Display"];

export function TileConfigDialog({ open, onOpenChange, dashboardId, editingTile, onSaved }: Props) {
  const isEditing = !!editingTile;

  // Step
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Tile type
  const [tileType, setTileType] = useState<TileType>(
    (editingTile?.tile_type as TileType) ?? "kpi"
  );

  // Data source
  const [entity, setEntity] = useState<EntitySource>(
    getConfigValue("entity", "deals")
  );
  const [aggregation, setAggregation] = useState<AggregationType>(
    getConfigValue("aggregation", "count")
  );
  const [field, setField] = useState<string | null>(
    getConfigValue("field", null)
  );
  const [chartType, setChartType] = useState<ChartType>(
    getConfigValue("chartType", "bar")
  );
  const [groupBy, setGroupBy] = useState(
    getConfigValue("groupBy", "source")
  );
  const [columns, setColumns] = useState<string[]>(
    getConfigValue("columns", ["title", "status"])
  );
  const [sortColumn, setSortColumn] = useState(
    getConfigValue("sort", { column: "created_at", direction: "desc" }).column ?? "created_at"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    (getConfigValue("sort", { column: "created_at", direction: "desc" }).direction as "asc" | "desc") ?? "desc"
  );
  const [limit, setLimit] = useState<number>(getConfigValue("limit", 10));

  // Filters
  const [filters, setFilters] = useState<TileFilter[]>(
    getConfigValue("filters", [])
  );
  const [timeRange, setTimeRange] = useState<TimeRange>(
    getConfigValue("timeRange", "all_time")
  );

  // Display
  const [title, setTitle] = useState(editingTile?.title ?? "New Tile");
  const [icon, setIcon] = useState<TileIcon>(getConfigValue("icon", "BarChart3"));
  const [glow, setGlow] = useState<GlowVariant>(getConfigValue("glow", "violet"));
  const [format, setFormat] = useState<ValueFormat>(getConfigValue("format", "number"));
  const [subtitle, setSubtitle] = useState(getConfigValue("subtitle", ""));
  const [gridW, setGridW] = useState(editingTile?.grid_w ?? (tileType === "kpi" ? 3 : 6));
  const [gridH, setGridH] = useState(editingTile?.grid_h ?? (tileType === "kpi" ? 1 : 2));
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping | undefined>(
    getConfigValue("timeGrouping", undefined)
  );
  const [comparisonPeriod, setComparisonPeriod] = useState<"previous_period" | "none">(
    getConfigValue("comparisonPeriod", "none")
  );

  function getConfigValue<T>(key: string, defaultValue: T): T {
    if (!editingTile?.config) return defaultValue;
    const config = editingTile.config as Record<string, unknown>;
    return (config[key] as T) ?? defaultValue;
  }

  // Build config from state
  function buildConfig(): KPITileConfig | ChartTileConfig | TableTileConfig {
    switch (tileType) {
      case "kpi":
        return {
          entity, aggregation, field: aggregation === "count" ? null : field,
          filters, timeRange, format, icon, glow,
          subtitle: subtitle || undefined,
          comparisonPeriod,
        } satisfies KPITileConfig;
      case "chart":
        return {
          entity, aggregation, field: aggregation === "count" ? null : field,
          chartType, groupBy, filters, timeRange,
          timeGrouping,
        } satisfies ChartTileConfig;
      case "table":
        return {
          entity,
          columns: columns.length > 0 ? columns : ["title"],
          filters,
          sort: { column: sortColumn, direction: sortDirection },
          limit,
        } satisfies TableTileConfig;
    }
  }

  const handleSave = async () => {
    setSaving(true);
    const config = buildConfig();

    if (isEditing && editingTile) {
      await updateTile({
        id: editingTile.id,
        title,
        tile_type: tileType,
        grid_w: gridW,
        grid_h: gridH,
        config,
      });
    } else {
      await addTile({
        dashboard_id: dashboardId,
        title,
        tile_type: tileType,
        grid_x: 0,
        grid_y: 0,
        grid_w: gridW,
        grid_h: gridH,
        config,
      });
    }

    setSaving(false);
    setStep(0);
    onSaved();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setStep(0);
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tile" : "Add Tile"}</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="mb-4 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-accent-primary" : "bg-bg-elevated"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="max-h-[400px] overflow-y-auto pr-1">
          {step === 0 && (
            <StepTileType value={tileType} onChange={setTileType} />
          )}
          {step === 1 && (
            <StepDataSource
              tileType={tileType}
              entity={entity}
              aggregation={aggregation}
              field={field}
              chartType={chartType}
              groupBy={groupBy}
              columns={columns}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              limit={limit}
              onEntityChange={setEntity}
              onAggregationChange={setAggregation}
              onFieldChange={setField}
              onChartTypeChange={setChartType}
              onGroupByChange={setGroupBy}
              onColumnsChange={setColumns}
              onSortColumnChange={setSortColumn}
              onSortDirectionChange={setSortDirection}
              onLimitChange={setLimit}
            />
          )}
          {step === 2 && (
            <StepFilters
              entity={entity}
              filters={filters}
              timeRange={timeRange}
              onFiltersChange={setFilters}
              onTimeRangeChange={setTimeRange}
            />
          )}
          {step === 3 && (
            <StepDisplay
              tileType={tileType}
              title={title}
              icon={icon}
              glow={glow}
              format={format}
              subtitle={subtitle}
              gridW={gridW}
              gridH={gridH}
              timeGrouping={timeGrouping}
              comparisonPeriod={comparisonPeriod}
              onTitleChange={setTitle}
              onIconChange={setIcon}
              onGlowChange={setGlow}
              onFormatChange={setFormat}
              onSubtitleChange={setSubtitle}
              onGridWChange={setGridW}
              onGridHChange={setGridH}
              onTimeGroupingChange={setTimeGrouping}
              onComparisonChange={setComparisonPeriod}
            />
          )}
        </div>

        <DialogFooter>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 rounded-lg border border-border-glass px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="gradient-button flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="gradient-button flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : isEditing ? "Update Tile" : "Add Tile"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
