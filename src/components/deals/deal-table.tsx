"use client";

import { formatCurrency } from "@/lib/utils";
import { DEAL_INDUSTRY_LABELS, DEAL_PAYMENT_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { Tables } from "@/types/database";

type DealRow = Tables<"deals"> & {
  contacts?: { first_name: string; last_name: string } | null;
  companies?: { company_name: string } | null;
};

type DealTableProps = {
  deals: DealRow[];
  onDealClick: (deal: DealRow) => void;
};

export function DealTable({ deals, onDealClick }: DealTableProps) {
  const columns: Column<DealRow>[] = [
    {
      key: "title",
      header: "Deal",
      sortable: true,
      render: (row) => <span className="font-medium text-text-primary">{row.title}</span>,
    },
    {
      key: "value",
      header: "Value",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-text-primary">
          {formatCurrency(row.value, row.currency)}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => {
        const c = row.contacts as DealRow["contacts"];
        return c ? `${c.first_name} ${c.last_name}` : <span className="text-text-tertiary">—</span>;
      },
    },
    {
      key: "company",
      header: "Company",
      render: (row) => {
        const co = row.companies as DealRow["companies"];
        return co ? co.company_name : <span className="text-text-tertiary">—</span>;
      },
    },
    {
      key: "deal_industry",
      header: "Industry",
      render: (row) =>
        row.deal_industry
          ? DEAL_INDUSTRY_LABELS[row.deal_industry] || row.deal_industry
          : <span className="text-text-tertiary">—</span>,
    },
    {
      key: "payment_type",
      header: "Payment",
      render: (row) =>
        row.payment_type
          ? DEAL_PAYMENT_TYPE_LABELS[row.payment_type] || row.payment_type
          : <span className="text-text-tertiary">—</span>,
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) =>
        row.priority ? (
          <Badge variant={row.priority === "Critical" ? "danger" : row.priority === "High" ? "warning" : "secondary"}>
            {row.priority}
          </Badge>
        ) : (
          <span className="text-text-tertiary">—</span>
        ),
    },
    {
      key: "expected_close_date",
      header: "Close Date",
      sortable: true,
      render: (row) =>
        row.expected_close_date
          ? new Date(row.expected_close_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : <span className="text-text-tertiary">—</span>,
    },
  ];

  return (
    <DataTable
      data={deals}
      columns={columns}
      keyExtractor={(row) => row.id}
      onRowClick={onDealClick}
      emptyMessage="No deals found"
    />
  );
}
