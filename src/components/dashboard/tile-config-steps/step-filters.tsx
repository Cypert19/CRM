"use client";

import { Plus, X } from "lucide-react";
import { getFilterableFields } from "@/lib/dashboard/entity-fields";
import type { EntitySource, TileFilter, TimeRange } from "@/types/dashboard";

type Props = {
  entity: EntitySource;
  filters: TileFilter[];
  timeRange: TimeRange;
  onFiltersChange: (filters: TileFilter[]) => void;
  onTimeRangeChange: (range: TimeRange) => void;
};

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "last_12_months", label: "Last 12 months" },
  { value: "this_month", label: "This month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
];

const OPERATORS: { value: TileFilter["operator"]; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "in", label: "in list" },
  { value: "is", label: "is null" },
];

export function StepFilters({ entity, filters, timeRange, onFiltersChange, onTimeRangeChange }: Props) {
  const filterableFields = getFilterableFields(entity);

  const addFilter = () => {
    const firstField = filterableFields[0];
    if (!firstField) return;
    onFiltersChange([...filters, { field: firstField.key, operator: "eq", value: "" }]);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, update: Partial<TileFilter>) => {
    onFiltersChange(filters.map((f, i) => (i === index ? { ...f, ...update } : f)));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-primary">Filters & time range</p>

      {/* Time range */}
      <div>
        <label className="mb-1 block text-xs font-medium text-text-tertiary">Time Range</label>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className="focus-ring w-full rounded-lg border border-border-glass bg-bg-elevated/50 px-3 py-2 text-sm text-text-primary outline-none"
        >
          {TIME_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Filter rows */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-tertiary">
          Conditions {filters.length > 0 && `(${filters.length})`}
        </label>

        {filters.map((filter, index) => {
          const fieldMeta = filterableFields.find((f) => f.key === filter.field);
          return (
            <div key={index} className="flex items-center gap-2">
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, { field: e.target.value })}
                className="flex-1 rounded-lg border border-border-glass bg-bg-elevated/50 px-2 py-1.5 text-xs text-text-primary outline-none"
              >
                {filterableFields.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>

              <select
                value={filter.operator}
                onChange={(e) => updateFilter(index, { operator: e.target.value as TileFilter["operator"] })}
                className="w-28 rounded-lg border border-border-glass bg-bg-elevated/50 px-2 py-1.5 text-xs text-text-primary outline-none"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {filter.operator !== "is" && (
                fieldMeta?.enumValues ? (
                  <select
                    value={String(filter.value ?? "")}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    className="flex-1 rounded-lg border border-border-glass bg-bg-elevated/50 px-2 py-1.5 text-xs text-text-primary outline-none"
                  >
                    <option value="">Select...</option>
                    {fieldMeta.enumValues.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldMeta?.type === "number" ? "number" : "text"}
                    value={String(filter.value ?? "")}
                    onChange={(e) => updateFilter(index, {
                      value: fieldMeta?.type === "number" ? Number(e.target.value) : e.target.value,
                    })}
                    placeholder="Value"
                    className="flex-1 rounded-lg border border-border-glass bg-bg-elevated/50 px-2 py-1.5 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
                  />
                )
              )}

              <button
                onClick={() => removeFilter(index)}
                className="rounded-md p-1 text-text-tertiary hover:bg-bg-elevated/50 hover:text-signal-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        <button
          onClick={addFilter}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border-glass px-3 py-1.5 text-xs text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
        >
          <Plus className="h-3 w-3" />
          Add filter
        </button>
      </div>
    </div>
  );
}
