"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ImportEntity,
  ParsedCompany,
  ParsedContact,
  ParsedDeal,
  ParsedNote,
  ParsedTask,
  DuplicateMatch,
} from "@/types/import";

// ─── Column Definitions ─────────────────────────────────────────────────────

type Column<T> = {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  width?: string;
};

const companyColumns: Column<ImportEntity<ParsedCompany>>[] = [
  { key: "company_name", label: "Name", render: (c) => c.company_name, width: "w-1/4" },
  { key: "domain", label: "Domain", render: (c) => c.domain || "—" },
  { key: "industry", label: "Industry", render: (c) => c.industry || "—" },
  { key: "phone", label: "Phone", render: (c) => c.phone || "—" },
  { key: "website", label: "Website", render: (c) => c.website || "—" },
];

const contactColumns: Column<ImportEntity<ParsedContact>>[] = [
  {
    key: "name",
    label: "Name",
    render: (c) => `${c.first_name} ${c.last_name}`,
    width: "w-1/4",
  },
  { key: "email", label: "Email", render: (c) => c.email || "—" },
  { key: "phone", label: "Phone", render: (c) => c.phone || "—" },
  { key: "job_title", label: "Job Title", render: (c) => c.job_title || "—" },
  { key: "lifecycle_stage", label: "Stage", render: (c) => c.lifecycle_stage || "—" },
];

const dealColumns: Column<ImportEntity<ParsedDeal>>[] = [
  { key: "title", label: "Title", render: (d) => d.title, width: "w-1/4" },
  {
    key: "value",
    label: "Value",
    render: (d) =>
      d.value !== undefined && d.value !== null
        ? `$${d.value.toLocaleString()}`
        : "—",
  },
  { key: "_stageName", label: "Stage", render: (d) => d._stageName || "—" },
  { key: "priority", label: "Priority", render: (d) => d.priority || "—" },
  { key: "source", label: "Source", render: (d) => d.source || "—" },
];

const noteColumns: Column<ImportEntity<ParsedNote>>[] = [
  { key: "title", label: "Title", render: (n) => n.title || "Untitled", width: "w-1/4" },
  {
    key: "plain_text",
    label: "Content",
    render: (n) =>
      n.plain_text.length > 80 ? n.plain_text.slice(0, 80) + "…" : n.plain_text,
    width: "w-1/2",
  },
];

const taskColumns: Column<ImportEntity<ParsedTask>>[] = [
  { key: "title", label: "Title", render: (t) => t.title, width: "w-1/3" },
  { key: "task_type", label: "Type", render: (t) => t.task_type || "—" },
  { key: "priority", label: "Priority", render: (t) => t.priority || "—" },
  { key: "due_date", label: "Due Date", render: (t) => t.due_date || "—" },
];

// ─── Helper to get columns by entity type ───────────────────────────────────

type EntityType = "companies" | "contacts" | "deals" | "notes" | "tasks";
type AnyEntity =
  | ImportEntity<ParsedCompany>
  | ImportEntity<ParsedContact>
  | ImportEntity<ParsedDeal>
  | ImportEntity<ParsedNote>
  | ImportEntity<ParsedTask>;

function getColumns(entityType: EntityType) {
  switch (entityType) {
    case "companies":
      return companyColumns;
    case "contacts":
      return contactColumns;
    case "deals":
      return dealColumns;
    case "notes":
      return noteColumns;
    case "tasks":
      return taskColumns;
  }
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") {
    return <CheckCircle2 className="h-4 w-4 text-signal-success" />;
  }
  if (status === "warning") {
    return <AlertTriangle className="h-4 w-4 text-signal-warning" />;
  }
  return <XCircle className="h-4 w-4 text-signal-danger" />;
}

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  entityType: EntityType;
  items: AnyEntity[];
  duplicates?: DuplicateMatch[];
  onToggleInclude: (tempId: string) => void;
};

export function EntityReviewTable({
  entityType,
  items,
  duplicates = [],
  onToggleInclude,
}: Props) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = getColumns(entityType) as Column<any>[];

  const duplicateMap = new Map(duplicates.map((d) => [d.tempId, d]));

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-text-tertiary">No {entityType} found in the imported data</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-glass">
            <th className="w-10 px-2 py-3 text-left">
              <span className="sr-only">Include</span>
            </th>
            <th className="w-8 px-1 py-3">
              <span className="sr-only">Status</span>
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary",
                  col.width
                )}
              >
                {col.label}
              </th>
            ))}
            <th className="w-8 px-1 py-3">
              <span className="sr-only">Expand</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const tempId = (item as AnyEntity & { _tempId: string })._tempId;
            const isExpanded = expandedRow === tempId;
            const duplicate = duplicateMap.get(tempId);

            return (
              <tr
                key={tempId}
                className={cn(
                  "border-b border-border-glass/50 transition-colors",
                  !item._included && "opacity-40"
                )}
              >
                {/* Checkbox */}
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={item._included}
                    onChange={() => onToggleInclude(tempId)}
                    className="h-4 w-4 rounded border-border-glass bg-bg-elevated text-accent-primary accent-accent-primary"
                  />
                </td>

                {/* Status */}
                <td className="px-1 py-3">
                  <StatusBadge status={item._status} />
                </td>

                {/* Data columns */}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-3 py-3 text-sm text-text-secondary", col.width)}
                  >
                    {col.render(item)}
                  </td>
                ))}

                {/* Expand */}
                <td className="px-1 py-3">
                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : tempId)}
                    className="rounded p-1 text-text-tertiary hover:text-text-secondary"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </td>

                {/* Expanded row details — rendered as additional content */}
                {isExpanded && (
                  <td colSpan={columns.length + 3}>
                    <ExpandedDetails
                      item={item}
                      duplicate={duplicate}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Expanded Details ───────────────────────────────────────────────────────

function ExpandedDetails({
  item,
  duplicate,
}: {
  item: AnyEntity;
  duplicate?: DuplicateMatch;
}) {
  return (
    <div className="bg-bg-card/30 px-6 py-4">
      {/* Duplicate warning */}
      {duplicate && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-signal-warning/10 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-signal-warning" />
          <span className="text-xs text-signal-warning">
            Possible duplicate: <strong>{duplicate.existingName}</strong> already exists
            (matched by {duplicate.matchField})
          </span>
        </div>
      )}

      {/* Errors */}
      {item._errors.length > 0 && (
        <div className="mb-3 space-y-1">
          {item._errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-signal-danger">
              <XCircle className="h-3.5 w-3.5" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {item._warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {item._warnings.map((warn, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-signal-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {warn}
            </div>
          ))}
        </div>
      )}

      {/* Full data preview */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        {Object.entries(item)
          .filter(
            ([key]) =>
              !key.startsWith("_") && key !== "tags"
          )
          .map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="font-medium text-text-tertiary">
                {key.replace(/_/g, " ")}:
              </span>
              <span className="text-text-secondary">
                {value === null || value === undefined
                  ? "—"
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
