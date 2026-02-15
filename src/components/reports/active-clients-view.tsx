"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { ReportKPICard } from "./report-kpi-card";
import { Briefcase, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import type { ActiveClientsData, ActiveClientDeal } from "@/actions/reports";

const priorityColors: Record<string, string> = {
  Critical: "bg-signal-danger/20 text-signal-danger",
  High: "bg-orange-500/20 text-orange-400",
  Medium: "bg-signal-warning/20 text-signal-warning",
  Low: "bg-text-tertiary/20 text-text-tertiary",
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return `$${value.toLocaleString()}`;
}

function DealRow({ deal }: { deal: ActiveClientDeal }) {
  return (
    <tr className="group border-b border-border-glass/30 transition-colors hover:bg-bg-elevated/40">
      {/* Client */}
      <td className="py-3 px-4">
        <Link href={`/deals/${deal.id}`} className="block">
          <span className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors">
            {deal.title}
          </span>
          {deal.company_name && (
            <span className="block text-[10px] text-text-tertiary mt-0.5">
              {deal.company_name}
            </span>
          )}
        </Link>
      </td>
      {/* Value */}
      <td className="py-3 px-3 text-right text-sm font-medium text-text-primary">
        {formatCurrency(deal.value)}
      </td>
      {/* Monthly Revenue */}
      <td className="py-3 px-3 text-right text-sm text-signal-success">
        {deal.monthly_revenue > 0 ? formatCurrency(deal.monthly_revenue) : "—"}
      </td>
      {/* Owner */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          {deal.owner_avatar ? (
            <img src={deal.owner_avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-elevated">
              <span className="text-[8px] font-medium text-text-secondary">
                {deal.owner_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
          )}
          <span className="text-xs text-text-secondary truncate max-w-[80px]">{deal.owner_name}</span>
        </div>
      </td>
      {/* Days Active */}
      <td className="py-3 px-3 text-center text-sm text-text-secondary">
        {deal.days_since_won}d
      </td>
      {/* Priority */}
      <td className="py-3 px-3 text-center">
        {deal.priority ? (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[deal.priority] || ""}`}>
            {deal.priority}
          </span>
        ) : (
          <span className="text-[10px] text-text-tertiary">—</span>
        )}
      </td>
      {/* Tasks */}
      <td className="py-3 px-3 text-center">
        <span className="text-sm text-text-secondary">{deal.task_count}</span>
        {deal.overdue_task_count > 0 && (
          <span className="ml-1 text-[10px] font-bold text-signal-danger" title={`${deal.overdue_task_count} overdue`}>
            ({deal.overdue_task_count}!)
          </span>
        )}
      </td>
      {/* Next Step */}
      <td className="py-3 px-3">
        <span className="text-xs text-text-tertiary truncate block max-w-[150px]" title={deal.next_step || ""}>
          {deal.next_step || "—"}
        </span>
      </td>
    </tr>
  );
}

function StageGroup({ stageName, stageColor, deals, totalValue }: {
  stageName: string;
  stageColor: string;
  deals: ActiveClientDeal[];
  totalValue: number;
}) {
  return (
    <div className="mb-4">
      {/* Stage Header */}
      <div
        className="flex items-center gap-3 rounded-t-lg px-4 py-2.5"
        style={{
          background: `linear-gradient(135deg, ${stageColor}15, ${stageColor}08)`,
          borderLeft: `3px solid ${stageColor}`,
        }}
      >
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stageColor }} />
        <span className="text-sm font-semibold text-text-primary">{stageName}</span>
        <span className="text-xs text-text-tertiary">
          {deals.length} {deals.length === 1 ? "deal" : "deals"} &middot; {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Deals Table */}
      {deals.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <tbody>
              {deals.map((deal) => (
                <DealRow key={deal.id} deal={deal} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-3 text-xs text-text-tertiary">No deals in this stage</div>
      )}
    </div>
  );
}

export function ActiveClientsView({ data }: { data: ActiveClientsData }) {
  const { deals, stages, totals } = data;

  if (deals.length === 0) {
    return (
      <GlassCard className="py-12 text-center">
        <Briefcase className="mx-auto h-10 w-10 text-text-tertiary/50" />
        <p className="mt-3 text-sm text-text-secondary">No active clients</p>
        <p className="mt-1 text-xs text-text-tertiary">
          Won deals will appear here once you close deals in your pipeline
        </p>
      </GlassCard>
    );
  }

  // Group deals by stage, sorted by display_order
  const groupedByStage = stages
    .filter((s) => s.deal_count > 0)
    .sort((a, b) => a.display_order - b.display_order)
    .map((stage) => ({
      ...stage,
      deals: deals
        .filter((d) => d.stage_name === stage.name)
        .sort((a, b) => b.days_since_won - a.days_since_won),
    }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ReportKPICard
          icon={<Briefcase className="h-4 w-4" />}
          label="Active Clients"
          value={totals.total_deals}
          format="number"
          subtitle="won deals in pipeline"
          glow="success"
          delay={0}
        />
        <ReportKPICard
          icon={<DollarSign className="h-4 w-4" />}
          label="Monthly Revenue"
          value={totals.total_monthly_revenue}
          format="currency"
          subtitle="recurring retainer"
          glow="cyan"
          delay={0.1}
        />
        <ReportKPICard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Contract Value"
          value={totals.total_value}
          format="currency"
          subtitle="all active deals"
          glow="violet"
          delay={0.2}
        />
        <ReportKPICard
          icon={<Calendar className="h-4 w-4" />}
          label="Avg Days Active"
          value={totals.avg_days_active}
          format="number"
          subtitle="since won"
          glow="warning"
          delay={0.3}
        />
      </div>

      {/* Grouped Data Table */}
      <GlassCard className="!p-0 overflow-hidden">
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border-glass bg-bg-elevated/30">
                <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Client
                </th>
                <th className="py-2.5 px-3 text-right text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Value
                </th>
                <th className="py-2.5 px-3 text-right text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Monthly
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Owner
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Days
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Priority
                </th>
                <th className="py-2.5 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Tasks
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Next Step
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Stage Groups */}
        {groupedByStage.map((stage) => (
          <StageGroup
            key={stage.name}
            stageName={stage.name}
            stageColor={stage.color}
            deals={stage.deals}
            totalValue={stage.total_value}
          />
        ))}
      </GlassCard>
    </div>
  );
}
