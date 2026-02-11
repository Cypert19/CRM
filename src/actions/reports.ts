"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";

export type PipelineStageReport = {
  name: string;
  color: string;
  count: number;
  value: number;
  is_won: boolean;
  is_lost: boolean;
};

export type DealTrend = {
  date: string;
  created: number;
  won: number;
  lost: number;
  pipeline_value: number;
};

export type WinLossData = {
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  open_deals: number;
  win_rate: number;
  total_won_value: number;
  total_lost_value: number;
  avg_deal_size: number;
  by_source: { source: string; won: number; lost: number; total: number }[];
};

export type DealVelocityData = {
  avg_days_to_close: number;
  avg_days_by_stage: { stage: string; color: string; avg_days: number }[];
  monthly_velocity: { month: string; avg_days: number; deals_closed: number }[];
};

export type ReportSummary = {
  pipeline_stages: PipelineStageReport[];
  deal_trends: DealTrend[];
  win_loss: WinLossData;
  velocity: DealVelocityData;
  total_pipeline_value: number;
  total_won_value: number;
  total_lost_value: number;
  total_deals: number;
  conversion_rate: number;
};

export async function getReportData(): Promise<ActionResponse<ReportSummary>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Fetch all deals with stage info
    const { data: deals, error: dealsError } = await admin
      .from("deals")
      .select("id, value, source, created_at, closed_at, stage_id, pipeline_stages(name, color, is_won, is_lost, display_order)")
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null);

    if (dealsError) return { success: false, error: dealsError.message };

    const allDeals = deals ?? [];

    // --- Pipeline by Stage ---
    const stageMap = new Map<string, PipelineStageReport>();
    for (const deal of allDeals) {
      const stage = deal.pipeline_stages as unknown as {
        name: string;
        color: string;
        is_won: boolean;
        is_lost: boolean;
        display_order: number;
      } | null;
      if (!stage) continue;

      const existing = stageMap.get(deal.stage_id) ?? {
        name: stage.name,
        color: stage.color,
        count: 0,
        value: 0,
        is_won: stage.is_won,
        is_lost: stage.is_lost,
      };
      existing.count += 1;
      existing.value += Number(deal.value);
      stageMap.set(deal.stage_id, existing);
    }
    const pipeline_stages = Array.from(stageMap.values());

    // --- Win/Loss ---
    const wonDeals = allDeals.filter((d) => (d.pipeline_stages as unknown as { is_won: boolean })?.is_won);
    const lostDeals = allDeals.filter((d) => (d.pipeline_stages as unknown as { is_lost: boolean })?.is_lost);
    const openDeals = allDeals.filter((d) => {
      const s = d.pipeline_stages as unknown as { is_won: boolean; is_lost: boolean } | null;
      return s && !s.is_won && !s.is_lost;
    });

    const total_won_value = wonDeals.reduce((s, d) => s + Number(d.value), 0);
    const total_lost_value = lostDeals.reduce((s, d) => s + Number(d.value), 0);
    const total_pipeline_value = openDeals.reduce((s, d) => s + Number(d.value), 0);

    const closedDeals = wonDeals.length + lostDeals.length;
    const win_rate = closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0;

    // Win/loss by source
    const sourceMap = new Map<string, { source: string; won: number; lost: number; total: number }>();
    for (const deal of allDeals) {
      const src = deal.source || "Unknown";
      const existing = sourceMap.get(src) ?? { source: src, won: 0, lost: 0, total: 0 };
      existing.total += 1;
      const s = deal.pipeline_stages as unknown as { is_won: boolean; is_lost: boolean } | null;
      if (s?.is_won) existing.won += 1;
      if (s?.is_lost) existing.lost += 1;
      sourceMap.set(src, existing);
    }

    const win_loss: WinLossData = {
      total_deals: allDeals.length,
      won_deals: wonDeals.length,
      lost_deals: lostDeals.length,
      open_deals: openDeals.length,
      win_rate,
      total_won_value,
      total_lost_value,
      avg_deal_size: allDeals.length > 0 ? Math.round(allDeals.reduce((s, d) => s + Number(d.value), 0) / allDeals.length) : 0,
      by_source: Array.from(sourceMap.values()),
    };

    // --- Deal Trends (last 6 months, weekly buckets) ---
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const deal_trends: DealTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const monthDeals = allDeals.filter((d) => {
        const created = new Date(d.created_at);
        return created >= monthStart && created <= monthEnd;
      });

      const monthWon = allDeals.filter((d) => {
        if (!d.closed_at) return false;
        const closed = new Date(d.closed_at);
        const s = d.pipeline_stages as unknown as { is_won: boolean } | null;
        return s?.is_won && closed >= monthStart && closed <= monthEnd;
      });

      const monthLost = allDeals.filter((d) => {
        if (!d.closed_at) return false;
        const closed = new Date(d.closed_at);
        const s = d.pipeline_stages as unknown as { is_lost: boolean } | null;
        return s?.is_lost && closed >= monthStart && closed <= monthEnd;
      });

      deal_trends.push({
        date: monthLabel,
        created: monthDeals.length,
        won: monthWon.length,
        lost: monthLost.length,
        pipeline_value: monthDeals.reduce((s, d) => s + Number(d.value), 0),
      });
    }

    // --- Deal Velocity ---
    const dealsWithCloseTime = wonDeals.filter((d) => d.closed_at && d.created_at);
    const avgDays = dealsWithCloseTime.length > 0
      ? Math.round(
          dealsWithCloseTime.reduce((s, d) => {
            const created = new Date(d.created_at);
            const closed = new Date(d.closed_at!);
            return s + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / dealsWithCloseTime.length
        )
      : 0;

    // Monthly velocity
    const monthly_velocity: { month: string; avg_days: number; deals_closed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const monthClosed = dealsWithCloseTime.filter((d) => {
        const closed = new Date(d.closed_at!);
        return closed >= monthStart && closed <= monthEnd;
      });

      const avgMonthDays = monthClosed.length > 0
        ? Math.round(
            monthClosed.reduce((s, d) => {
              const created = new Date(d.created_at);
              const closed = new Date(d.closed_at!);
              return s + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / monthClosed.length
          )
        : 0;

      monthly_velocity.push({
        month: monthLabel,
        avg_days: avgMonthDays,
        deals_closed: monthClosed.length,
      });
    }

    const velocity: DealVelocityData = {
      avg_days_to_close: avgDays,
      avg_days_by_stage: [], // Would need deal stage history tracking
      monthly_velocity,
    };

    const conversion_rate = allDeals.length > 0 ? Math.round((wonDeals.length / allDeals.length) * 100) : 0;

    return {
      success: true,
      data: {
        pipeline_stages,
        deal_trends,
        win_loss,
        velocity,
        total_pipeline_value,
        total_won_value,
        total_lost_value,
        total_deals: allDeals.length,
        conversion_rate,
      },
    };
  } catch (err) {
    console.error("Report error:", err);
    return { success: false, error: "Failed to generate report data" };
  }
}
