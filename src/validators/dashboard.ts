import { z } from "zod";

// ─── Shared Enums ───

const entitySourceSchema = z.enum(["deals", "contacts", "companies", "tasks", "activities"]);
const aggregationSchema = z.enum(["count", "sum", "avg", "min", "max"]);
const chartTypeSchema = z.enum(["bar", "line", "area", "pie"]);
const tileTypeSchema = z.enum(["kpi", "chart", "table"]);
const timeRangeSchema = z.enum([
  "last_7_days", "last_30_days", "last_90_days", "last_6_months",
  "last_12_months", "this_month", "this_quarter", "this_year", "all_time",
]);
const timeGroupingSchema = z.enum(["day", "week", "month", "quarter"]);
const valueFormatSchema = z.enum(["number", "currency", "percent", "days"]);
const glowSchema = z.enum(["violet", "cyan", "success", "warning", "danger"]);
const tileIconSchema = z.enum([
  "DollarSign", "Users", "Building", "CheckSquare",
  "TrendingUp", "Target", "Trophy", "Activity",
  "BarChart3", "PieChart", "Zap", "Calendar",
]);

const tileFilterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
});

// ─── Config Schemas ───

export const kpiConfigSchema = z.object({
  entity: entitySourceSchema,
  aggregation: aggregationSchema,
  field: z.string().nullable(),
  filters: z.array(tileFilterSchema).default([]),
  timeRange: timeRangeSchema.default("all_time"),
  format: valueFormatSchema.default("number"),
  icon: tileIconSchema.default("BarChart3"),
  glow: glowSchema.default("violet"),
  subtitle: z.string().max(100).optional(),
  comparisonPeriod: z.enum(["previous_period", "none"]).default("none"),
});

export const chartConfigSchema = z.object({
  entity: entitySourceSchema,
  aggregation: aggregationSchema,
  field: z.string().nullable(),
  chartType: chartTypeSchema,
  groupBy: z.string().min(1),
  filters: z.array(tileFilterSchema).default([]),
  timeRange: timeRangeSchema.default("last_6_months"),
  timeGrouping: timeGroupingSchema.optional(),
  colors: z.array(z.string()).max(10).optional(),
});

export const tableConfigSchema = z.object({
  entity: entitySourceSchema,
  columns: z.array(z.string().min(1)).min(1).max(10),
  filters: z.array(tileFilterSchema).default([]),
  sort: z.object({
    column: z.string().min(1),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }),
  limit: z.number().int().min(1).max(50).default(10),
});

export const tileConfigSchema = z.union([kpiConfigSchema, chartConfigSchema, tableConfigSchema]);

// ─── Dashboard CRUD ───

export const createDashboardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
});

export const updateDashboardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  is_default: z.boolean().optional(),
});

export const deleteDashboardSchema = z.object({
  id: z.string().uuid(),
});

// ─── Tile CRUD ───

export const addTileSchema = z.object({
  dashboard_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  tile_type: tileTypeSchema,
  grid_x: z.number().int().min(0).max(11).default(0),
  grid_y: z.number().int().min(0).default(0),
  grid_w: z.number().int().min(1).max(12).default(3),
  grid_h: z.number().int().min(1).max(4).default(1),
  config: tileConfigSchema,
});

export const updateTileSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  tile_type: tileTypeSchema.optional(),
  grid_x: z.number().int().min(0).max(11).optional(),
  grid_y: z.number().int().min(0).optional(),
  grid_w: z.number().int().min(1).max(12).optional(),
  grid_h: z.number().int().min(1).max(4).optional(),
  config: tileConfigSchema.optional(),
});

export const removeTileSchema = z.object({
  id: z.string().uuid(),
});

export const reorderTilesSchema = z.object({
  dashboard_id: z.string().uuid(),
  tiles: z.array(z.object({
    id: z.string().uuid(),
    grid_x: z.number().int().min(0).max(11),
    grid_y: z.number().int().min(0),
    grid_w: z.number().int().min(1).max(12),
    grid_h: z.number().int().min(1).max(4),
    display_order: z.number().int().min(0),
  })),
});

export const computeTileDataSchema = z.object({
  tile_type: tileTypeSchema,
  config: tileConfigSchema,
});

// ─── Inferred Types ───

export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>;
export type AddTileInput = z.infer<typeof addTileSchema>;
export type UpdateTileInput = z.infer<typeof updateTileSchema>;
export type ReorderTilesInput = z.infer<typeof reorderTilesSchema>;
export type ComputeTileDataInput = z.infer<typeof computeTileDataSchema>;
