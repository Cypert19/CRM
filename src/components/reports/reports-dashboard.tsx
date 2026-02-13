"use client";

import { motion } from "framer-motion";
import { DollarSign, Trophy, XCircle, TrendingUp, Target, BarChart3, FileSearch, Repeat, Code } from "lucide-react";
import { ReportKPICard } from "./report-kpi-card";
import { DealTrendChart } from "./deal-trend-chart";
import { PipelineValueChart } from "./pipeline-value-chart";
import { WinLossChart } from "./win-loss-chart";
import { VelocityChart } from "./velocity-chart";
import { PipelineStageChart } from "./pipeline-stage-chart";
import { MonthlyRevenueChart } from "./monthly-revenue-chart";
import { GlassCard } from "@/components/ui/glass-card";
import type { ReportSummary } from "@/actions/reports";

type Props = {
  data: ReportSummary;
};

export function ReportsDashboard({ data }: Props) {
  const hasDeals = data.total_deals > 0;

  return (
    <div className="space-y-6">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ReportKPICard
          label="Total Pipeline"
          value={data.total_pipeline_value}
          format="currency"
          icon={<DollarSign className="h-5 w-5 text-accent-primary" />}
          glow="violet"
          delay={0}
        />
        <ReportKPICard
          label="Won Revenue"
          value={data.total_won_value}
          format="currency"
          icon={<Trophy className="h-5 w-5 text-signal-success" />}
          glow="success"
          subtitle={`${data.win_loss.won_deals} deals`}
          delay={0.08}
        />
        <ReportKPICard
          label="Lost Revenue"
          value={data.total_lost_value}
          format="currency"
          icon={<XCircle className="h-5 w-5 text-signal-danger" />}
          glow="danger"
          subtitle={`${data.win_loss.lost_deals} deals`}
          delay={0.16}
        />
        <ReportKPICard
          label="Win Rate"
          value={data.conversion_rate}
          format="percent"
          icon={<TrendingUp className="h-5 w-5 text-accent-cyan" />}
          glow="cyan"
          subtitle={`of ${data.total_deals} total`}
          delay={0.24}
        />
        <ReportKPICard
          label="Avg Deal Size"
          value={data.win_loss.avg_deal_size}
          format="currency"
          icon={<Target className="h-5 w-5 text-signal-warning" />}
          glow="warning"
          delay={0.32}
        />
      </div>

      {/* Revenue Breakdown Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportKPICard
          label="Audit Fees"
          value={data.revenue_breakdown.audit_fee}
          format="currency"
          icon={<FileSearch className="h-5 w-5 text-signal-warning" />}
          glow="warning"
          subtitle={`Won: $${Math.round(data.won_revenue_breakdown.audit_fee).toLocaleString()}`}
          delay={0.4}
        />
        <ReportKPICard
          label="Monthly Retainers"
          value={data.revenue_breakdown.retainer_monthly}
          format="currency"
          icon={<Repeat className="h-5 w-5 text-signal-success" />}
          glow="success"
          subtitle={`Won: $${Math.round(data.won_revenue_breakdown.retainer_monthly).toLocaleString()}`}
          delay={0.48}
        />
        <ReportKPICard
          label="Custom Development"
          value={data.revenue_breakdown.custom_dev_fee}
          format="currency"
          icon={<Code className="h-5 w-5 text-accent-cyan" />}
          glow="cyan"
          subtitle={`Won: $${Math.round(data.won_revenue_breakdown.custom_dev_fee).toLocaleString()}`}
          delay={0.56}
        />
      </div>

      {hasDeals ? (
        <>
          {/* Monthly Revenue Chart */}
          <MonthlyRevenueChart data={data.monthly_revenue} />

          {/* Charts Row 1 - Deal Flow & Pipeline Value */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DealTrendChart data={data.deal_trends} />
            <PipelineValueChart data={data.deal_trends} />
          </div>

          {/* Charts Row 2 - Win/Loss Analysis */}
          <WinLossChart data={data.win_loss} />

          {/* Charts Row 3 - Velocity & Pipeline Stages */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VelocityChart data={data.velocity} />
            <PipelineStageChart stages={data.pipeline_stages} />
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard className="py-16 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-text-tertiary/30" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">No data to report yet</h3>
            <p className="mt-2 text-sm text-text-tertiary">
              Start creating deals to populate your reports and analytics.
            </p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
