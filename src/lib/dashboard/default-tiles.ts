import type { TileType, KPITileConfig, ChartTileConfig } from "@/types/dashboard";

type DefaultTile = {
  title: string;
  tile_type: TileType;
  grid_w: number;
  grid_h: number;
  config: KPITileConfig | ChartTileConfig;
};

export const DEFAULT_TILES: DefaultTile[] = [
  {
    title: "Total Deals",
    tile_type: "kpi",
    grid_w: 3,
    grid_h: 1,
    config: {
      entity: "deals",
      aggregation: "count",
      field: null,
      filters: [],
      timeRange: "all_time",
      format: "number",
      icon: "Target",
      glow: "violet",
      subtitle: "All time",
      comparisonPeriod: "none",
    } satisfies KPITileConfig,
  },
  {
    title: "Pipeline Value",
    tile_type: "kpi",
    grid_w: 3,
    grid_h: 1,
    config: {
      entity: "deals",
      aggregation: "sum",
      field: "value",
      filters: [],
      timeRange: "all_time",
      format: "currency",
      icon: "DollarSign",
      glow: "success",
      subtitle: "Open pipeline",
      comparisonPeriod: "none",
    } satisfies KPITileConfig,
  },
  {
    title: "Deals by Source",
    tile_type: "chart",
    grid_w: 6,
    grid_h: 2,
    config: {
      entity: "deals",
      aggregation: "count",
      field: null,
      chartType: "bar",
      groupBy: "source",
      filters: [],
      timeRange: "all_time",
      colors: ["#F97316", "#FB923C", "#FDBA74", "#FED7AA"],
    } satisfies ChartTileConfig,
  },
  {
    title: "Deals Over Time",
    tile_type: "chart",
    grid_w: 6,
    grid_h: 2,
    config: {
      entity: "deals",
      aggregation: "count",
      field: null,
      chartType: "area",
      groupBy: "created_at",
      filters: [],
      timeRange: "last_6_months",
      timeGrouping: "month",
      colors: ["#F97316"],
    } satisfies ChartTileConfig,
  },
];
