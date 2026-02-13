// ─── Custom Dashboard Builder Types ───

export type EntitySource = "deals" | "contacts" | "companies" | "tasks" | "activities";

export type AggregationType = "count" | "sum" | "avg" | "min" | "max";

export type ChartType = "bar" | "line" | "area" | "pie";

export type TileType = "kpi" | "chart" | "table";

export type TimeRange =
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "last_6_months"
  | "last_12_months"
  | "this_month"
  | "this_quarter"
  | "this_year"
  | "all_time";

export type TimeGrouping = "day" | "week" | "month" | "quarter";

export type ValueFormat = "number" | "currency" | "percent" | "days";

export type TileIcon =
  | "DollarSign" | "Users" | "Building" | "CheckSquare"
  | "TrendingUp" | "Target" | "Trophy" | "Activity"
  | "BarChart3" | "PieChart" | "Zap" | "Calendar";

export type GlowVariant = "violet" | "cyan" | "success" | "warning" | "danger";

export type TileFilter = {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";
  value: string | number | boolean | string[] | null;
};

// ─── Tile Configs ───

export type KPITileConfig = {
  entity: EntitySource;
  aggregation: AggregationType;
  field: string | null;
  filters: TileFilter[];
  timeRange: TimeRange;
  format: ValueFormat;
  icon: TileIcon;
  glow: GlowVariant;
  subtitle?: string;
  comparisonPeriod?: "previous_period" | "none";
};

export type ChartTileConfig = {
  entity: EntitySource;
  aggregation: AggregationType;
  field: string | null;
  chartType: ChartType;
  groupBy: string;
  filters: TileFilter[];
  timeRange: TimeRange;
  timeGrouping?: TimeGrouping;
  colors?: string[];
};

export type TableTileConfig = {
  entity: EntitySource;
  columns: string[];
  filters: TileFilter[];
  sort: { column: string; direction: "asc" | "desc" };
  limit: number;
};

export type TileConfig = KPITileConfig | ChartTileConfig | TableTileConfig;

// ─── Grid Position ───

export type GridPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

// ─── Database Row Types ───

export type DashboardTile = {
  id: string;
  dashboard_id: string;
  workspace_id: string;
  title: string;
  tile_type: TileType;
  grid_x: number;
  grid_y: number;
  grid_w: number;
  grid_h: number;
  display_order: number;
  config: TileConfig;
  created_at: string;
  updated_at: string;
};

export type CustomDashboard = {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  tiles: DashboardTile[];
  created_at: string;
  updated_at: string;
};

// ─── Computed Tile Data (returned from server) ───

export type KPITileData = {
  value: number;
  previousValue?: number;
};

export type ChartDataPoint = {
  label: string;
  value: number;
  [key: string]: string | number;
};

export type ChartTileData = {
  points: ChartDataPoint[];
};

export type TableTileColumn = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "badge";
};

export type TableTileRow = Record<string, string | number | boolean | null>;

export type TableTileData = {
  rows: TableTileRow[];
  columns: TableTileColumn[];
};

export type TileData = KPITileData | ChartTileData | TableTileData;

// ─── Entity Field Metadata (for config UI + query validation) ───

export type EntityFieldMeta = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "enum" | "boolean";
  enumValues?: string[];
  aggregatable: boolean;
  groupable: boolean;
  filterable: boolean;
};
