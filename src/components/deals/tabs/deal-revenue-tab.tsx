"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DollarSign, RotateCcw, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { getDealRevenueSchedule, upsertRevenueItem, deleteRevenueItem } from "@/actions/revenue";
import type { RevenueSchedule, MonthlyRevenueRow } from "@/actions/revenue";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  dealId: string;
  currency?: string;
};

function formatMonth(dateStr: string) {
  const [y, m] = dateStr.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

type EditingCell = {
  month: string;
  field: "retainer" | "audit_fee" | "custom_dev_fee";
};

export function DealRevenueTab({ dealId, currency = "USD" }: Props) {
  const [schedule, setSchedule] = useState<RevenueSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSchedule = useCallback(async () => {
    const result = await getDealRevenueSchedule(dealId);
    if (result.success && result.data) {
      setSchedule(result.data);
    } else {
      toast.error(result.error || "Failed to load revenue schedule");
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const startEdit = (month: string, field: EditingCell["field"], currentValue: number) => {
    setEditingCell({ month, field });
    setEditValue(String(currentValue));
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    const amount = Number(editValue);
    if (isNaN(amount) || amount < 0) {
      toast.error("Amount must be a non-negative number");
      return;
    }

    setSaving(true);
    const itemType = editingCell.field === "retainer" ? "retainer" : editingCell.field;
    const result = await upsertRevenueItem({
      deal_id: dealId,
      month: editingCell.month,
      item_type: itemType,
      amount,
    });

    if (result.success) {
      await fetchSchedule();
      toast.success("Revenue item saved");
    } else {
      toast.error(result.error || "Failed to save");
    }
    setSaving(false);
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const resetAmendment = async (month: string, field: EditingCell["field"]) => {
    const itemType = field === "retainer" ? "retainer" : field;
    const result = await deleteRevenueItem({
      deal_id: dealId,
      month,
      item_type: itemType,
    });
    if (result.success) {
      await fetchSchedule();
      toast.success("Reverted to default");
    } else {
      toast.error(result.error || "Failed to reset");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  if (!schedule || schedule.months.length === 0) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <DollarSign className="mb-3 h-10 w-10 text-text-tertiary" />
          <p className="text-sm font-medium text-text-secondary">No revenue schedule</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Set a Revenue Start Date in the Overview tab to begin tracking monthly revenue.<br />
            End date is optional — ongoing relationships will track to the current month automatically.
          </p>
        </div>
      </GlassCard>
    );
  }

  const renderCell = (
    row: MonthlyRevenueRow,
    field: EditingCell["field"],
    value: number,
    isAmended: boolean
  ) => {
    const isEditing = editingCell?.month === row.month && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            disabled={saving}
            className="w-24 rounded bg-bg-elevated px-2 py-1 text-xs text-text-primary outline-none ring-1 ring-accent-primary/50 focus:ring-accent-primary"
          />
        </div>
      );
    }

    return (
      <div className="group/cell flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => startEdit(row.month, field, value)}
          className="relative cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-elevated"
        >
          {isAmended && (
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent-primary" title="Amended" />
          )}
          {formatCurrency(value, currency)}
        </button>
        {isAmended && (
          <button
            type="button"
            onClick={() => resetAmendment(row.month, field)}
            className="hidden shrink-0 rounded p-0.5 text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-secondary group-hover/cell:inline-flex"
            title="Reset to default"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Revenue", value: schedule.totals.total, color: "text-accent-primary" },
          { label: "Total Retainer", value: schedule.totals.retainer, color: "text-signal-success" },
          { label: "Total Audit", value: schedule.totals.audit_fee, color: "text-signal-warning" },
          { label: "Total Custom Dev", value: schedule.totals.custom_dev_fee, color: "text-accent-cyan" },
        ].map((card) => (
          <GlassCard key={card.label} className="!p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{card.label}</p>
            <p className={`mt-1 text-lg font-bold ${card.color}`}>{formatCurrency(card.value, currency)}</p>
          </GlassCard>
        ))}
      </div>

      {/* Monthly Table */}
      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Monthly Revenue Schedule</h3>
          <span className="text-xs text-text-tertiary">({schedule.months.length} months)</span>
        </div>
        <p className="mb-3 text-[11px] text-text-tertiary">
          Click any cell to amend. Cells with an <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-primary align-middle" /> are amended from the default.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Month</th>
                <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Retainer</th>
                <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Audit Fee</th>
                <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Custom Dev</th>
                <th className="pb-2 text-[10px] font-medium uppercase tracking-wider text-text-tertiary text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {schedule.months.map((row) => (
                <tr key={row.month} className="border-b border-white/[0.03] hover:bg-bg-elevated/30 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="text-xs font-medium text-text-secondary">{formatMonth(row.month)}</span>
                  </td>
                  <td className="py-2.5 pr-4">{renderCell(row, "retainer", row.retainer, row.is_retainer_amended)}</td>
                  <td className="py-2.5 pr-4">{renderCell(row, "audit_fee", row.audit_fee, row.is_audit_amended)}</td>
                  <td className="py-2.5 pr-4">{renderCell(row, "custom_dev_fee", row.custom_dev_fee, row.is_custom_dev_amended)}</td>
                  <td className="py-2.5 text-right">
                    <span className="text-xs font-semibold text-text-primary">{formatCurrency(row.total, currency)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td className="py-3 pr-4 text-xs font-semibold text-text-primary">Totals</td>
                <td className="py-3 pr-4 text-xs font-semibold text-signal-success">{formatCurrency(schedule.totals.retainer, currency)}</td>
                <td className="py-3 pr-4 text-xs font-semibold text-signal-warning">{formatCurrency(schedule.totals.audit_fee, currency)}</td>
                <td className="py-3 pr-4 text-xs font-semibold text-accent-cyan">{formatCurrency(schedule.totals.custom_dev_fee, currency)}</td>
                <td className="py-3 text-right text-xs font-bold text-accent-primary">{formatCurrency(schedule.totals.total, currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
