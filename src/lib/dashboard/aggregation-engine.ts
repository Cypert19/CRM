import { createAdminClient } from "@/lib/supabase/admin";
import { ENTITY_FIELD_MAP, isValidField, getFieldMeta } from "./entity-fields";
import { getTimeRangeStart, getPreviousPeriodStart, getPreviousPeriodEnd, generateTimeBuckets } from "./time-utils";
import type {
  EntitySource,
  AggregationType,
  TileFilter,
  TimeRange,
  KPITileConfig,
  ChartTileConfig,
  TableTileConfig,
  KPITileData,
  ChartTileData,
  ChartDataPoint,
  TableTileData,
  TableTileColumn,
  TableTileRow,
} from "@/types/dashboard";

const MAX_ROWS = 10_000;

const SOFT_DELETE_ENTITIES: EntitySource[] = ["deals", "contacts", "companies"];

// ─── Query Helpers ───

type SupabaseQuery = ReturnType<ReturnType<typeof createAdminClient>["from"]>;

function buildBaseQuery(
  admin: ReturnType<typeof createAdminClient>,
  entity: EntitySource,
  workspaceId: string,
  selectFields = "*"
) {
  let query = admin.from(entity).select(selectFields).eq("workspace_id", workspaceId);
  if (SOFT_DELETE_ENTITIES.includes(entity)) {
    query = query.is("deleted_at", null);
  }
  return query;
}

function applyFilters(
  query: SupabaseQuery,
  entity: EntitySource,
  filters: TileFilter[]
): SupabaseQuery {
  for (const filter of filters) {
    if (!isValidField(entity, filter.field)) continue;

    switch (filter.operator) {
      case "eq": query = query.eq(filter.field, filter.value as string); break;
      case "neq": query = query.neq(filter.field, filter.value as string); break;
      case "gt": query = query.gt(filter.field, filter.value as string); break;
      case "gte": query = query.gte(filter.field, filter.value as string); break;
      case "lt": query = query.lt(filter.field, filter.value as string); break;
      case "lte": query = query.lte(filter.field, filter.value as string); break;
      case "like": query = query.like(filter.field, filter.value as string); break;
      case "ilike": query = query.ilike(filter.field, filter.value as string); break;
      case "in": query = query.in(filter.field, filter.value as string[]); break;
      case "is": query = query.is(filter.field, filter.value as null); break;
    }
  }
  return query;
}

function applyTimeRange(
  query: SupabaseQuery,
  timeRange: TimeRange,
  dateField = "created_at"
): SupabaseQuery {
  const start = getTimeRangeStart(timeRange);
  if (start) {
    query = query.gte(dateField, start.toISOString());
  }
  return query;
}

// ─── Aggregation ───

function aggregate(
  rows: Record<string, unknown>[],
  agg: AggregationType,
  field: string | null
): number {
  if (agg === "count") return rows.length;
  if (!field) return 0;

  const values = rows
    .map((r) => Number(r[field]))
    .filter((v) => !isNaN(v));
  if (!values.length) return 0;

  switch (agg) {
    case "sum": return values.reduce((a, b) => a + b, 0);
    case "avg": return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    case "min": return Math.min(...values);
    case "max": return Math.max(...values);
    default: return 0;
  }
}

// ─── KPI ───

export async function computeKPIData(
  config: KPITileConfig,
  workspaceId: string
): Promise<KPITileData> {
  const admin = createAdminClient();
  let query = buildBaseQuery(admin, config.entity, workspaceId);
  query = applyFilters(query, config.entity, config.filters);
  query = applyTimeRange(query, config.timeRange);

  const { data: rows } = await query.limit(MAX_ROWS);
  if (!rows?.length) return { value: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = aggregate(rows as any, config.aggregation, config.field);

  let previousValue: number | undefined;
  if (config.comparisonPeriod === "previous_period") {
    const prevStart = getPreviousPeriodStart(config.timeRange);
    const prevEnd = getPreviousPeriodEnd(config.timeRange);

    if (prevStart && prevEnd) {
      let prevQuery = buildBaseQuery(admin, config.entity, workspaceId);
      prevQuery = applyFilters(prevQuery, config.entity, config.filters);
      prevQuery = prevQuery
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", prevEnd.toISOString());

      const { data: prevRows } = await prevQuery.limit(MAX_ROWS);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      previousValue = aggregate((prevRows ?? []) as any, config.aggregation, config.field);
    }
  }

  return { value, previousValue };
}

// ─── Chart ───

export async function computeChartData(
  config: ChartTileConfig,
  workspaceId: string
): Promise<ChartTileData> {
  const admin = createAdminClient();
  let query = buildBaseQuery(admin, config.entity, workspaceId);
  query = applyFilters(query, config.entity, config.filters);
  query = applyTimeRange(query, config.timeRange);

  const { data } = await query.limit(MAX_ROWS);
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  if (!rows.length) return { points: [] };

  const fieldMeta = getFieldMeta(config.entity, config.groupBy);

  // Time-series grouping
  if (config.timeGrouping && fieldMeta?.type === "date") {
    const start = getTimeRangeStart(config.timeRange) ?? new Date(0);
    const end = new Date();
    const buckets = generateTimeBuckets(start, end, config.timeGrouping);

    const points: ChartDataPoint[] = buckets.map((bucket) => {
      const bucketRows = rows.filter((r) => {
        const d = new Date(r[config.groupBy] as string);
        return d >= bucket.start && d < bucket.end;
      });
      return {
        label: bucket.label,
        value: aggregate(bucketRows, config.aggregation, config.field),
      };
    });

    return { points };
  }

  // Categorical grouping
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = String(row[config.groupBy] ?? "Unknown");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const points: ChartDataPoint[] = Array.from(groups.entries())
    .map(([label, groupRows]) => ({
      label,
      value: aggregate(groupRows, config.aggregation, config.field),
    }))
    .sort((a, b) => b.value - a.value);

  return { points };
}

// ─── Table ───

export async function computeTableData(
  config: TableTileConfig,
  workspaceId: string
): Promise<TableTileData> {
  const admin = createAdminClient();
  const selectFields = ["id", ...config.columns].join(", ");
  let query = buildBaseQuery(admin, config.entity, workspaceId, selectFields);
  query = applyFilters(query, config.entity, config.filters);
  query = query.order(config.sort.column, { ascending: config.sort.direction === "asc" });
  query = query.limit(config.limit);

  const { data: rows } = await query;

  const columns: TableTileColumn[] = config.columns.map((key) => {
    const meta = ENTITY_FIELD_MAP[config.entity].find((f) => f.key === key);
    let type: TableTileColumn["type"] = "text";
    if (meta?.type === "number") type = "number";
    else if (meta?.type === "date") type = "date";
    else if (meta?.type === "enum") type = "badge";
    return { key, label: meta?.label ?? key, type };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { rows: ((rows ?? []) as any) as TableTileRow[], columns };
}
