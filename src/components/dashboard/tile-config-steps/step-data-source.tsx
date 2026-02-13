"use client";

import { ENTITY_FIELD_MAP, getAggregatableFields, getGroupableFields } from "@/lib/dashboard/entity-fields";
import type { TileType, EntitySource, AggregationType, ChartType } from "@/types/dashboard";

type Props = {
  tileType: TileType;
  entity: EntitySource;
  aggregation: AggregationType;
  field: string | null;
  chartType: ChartType;
  groupBy: string;
  columns: string[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  limit: number;
  onEntityChange: (entity: EntitySource) => void;
  onAggregationChange: (agg: AggregationType) => void;
  onFieldChange: (field: string | null) => void;
  onChartTypeChange: (type: ChartType) => void;
  onGroupByChange: (field: string) => void;
  onColumnsChange: (columns: string[]) => void;
  onSortColumnChange: (column: string) => void;
  onSortDirectionChange: (dir: "asc" | "desc") => void;
  onLimitChange: (limit: number) => void;
};

const ENTITIES: { value: EntitySource; label: string }[] = [
  { value: "deals", label: "Deals" },
  { value: "contacts", label: "Contacts" },
  { value: "companies", label: "Companies" },
  { value: "tasks", label: "Tasks" },
  { value: "activities", label: "Activities" },
];

const AGGREGATIONS: { value: AggregationType; label: string }[] = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
];

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
];

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-tertiary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function StepDataSource(props: Props) {
  const {
    tileType, entity, aggregation, field, chartType, groupBy,
    columns, sortColumn, sortDirection, limit,
    onEntityChange, onAggregationChange, onFieldChange,
    onChartTypeChange, onGroupByChange,
    onColumnsChange, onSortColumnChange, onSortDirectionChange, onLimitChange,
  } = props;

  const aggregatableFields = getAggregatableFields(entity);
  const groupableFields = getGroupableFields(entity);
  const allFields = ENTITY_FIELD_MAP[entity];

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-primary">Configure data source</p>

      <SelectField
        label="Entity"
        value={entity}
        options={ENTITIES}
        onChange={(v) => onEntityChange(v as EntitySource)}
      />

      {/* KPI + Chart: aggregation settings */}
      {(tileType === "kpi" || tileType === "chart") && (
        <>
          <SelectField
            label="Aggregation"
            value={aggregation}
            options={AGGREGATIONS}
            onChange={(v) => onAggregationChange(v as AggregationType)}
          />

          {aggregation !== "count" && (
            <SelectField
              label="Field"
              value={field ?? ""}
              options={[
                { value: "", label: "Select a field..." },
                ...aggregatableFields.map((f) => ({ value: f.key, label: f.label })),
              ]}
              onChange={(v) => onFieldChange(v || null)}
            />
          )}
        </>
      )}

      {/* Chart: chart type + group by */}
      {tileType === "chart" && (
        <>
          <SelectField
            label="Chart Type"
            value={chartType}
            options={CHART_TYPES}
            onChange={(v) => onChartTypeChange(v as ChartType)}
          />

          <SelectField
            label="Group By"
            value={groupBy}
            options={[
              { value: "", label: "Select a field..." },
              ...groupableFields.map((f) => ({ value: f.key, label: f.label })),
            ]}
            onChange={onGroupByChange}
          />
        </>
      )}

      {/* Table: column selection */}
      {tileType === "table" && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-tertiary">
              Columns (select up to 10)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {allFields.map((f) => (
                <label
                  key={f.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    columns.includes(f.key)
                      ? "border-accent-primary/30 bg-accent-primary/10 text-accent-primary"
                      : "border-border-glass text-text-secondary hover:bg-bg-elevated/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={columns.includes(f.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onColumnsChange([...columns, f.key].slice(0, 10));
                      } else {
                        onColumnsChange(columns.filter((c) => c !== f.key));
                      }
                    }}
                    className="sr-only"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Sort By"
              value={sortColumn}
              options={allFields.map((f) => ({ value: f.key, label: f.label }))}
              onChange={onSortColumnChange}
            />
            <SelectField
              label="Direction"
              value={sortDirection}
              options={[
                { value: "desc", label: "Descending" },
                { value: "asc", label: "Ascending" },
              ]}
              onChange={(v) => onSortDirectionChange(v as "asc" | "desc")}
            />
          </div>

          <SelectField
            label="Rows Limit"
            value={String(limit)}
            options={[
              { value: "5", label: "5 rows" },
              { value: "10", label: "10 rows" },
              { value: "15", label: "15 rows" },
              { value: "20", label: "20 rows" },
            ]}
            onChange={(v) => onLimitChange(Number(v))}
          />
        </>
      )}
    </div>
  );
}
