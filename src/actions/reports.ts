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

export type RevenueBreakdown = {
  audit_fee: number;
  retainer_monthly: number;
  custom_dev_fee: number;
};

export type MonthlyRevenueData = {
  month: string; // "Jan '25"
  retainer: number;
  audit_fee: number;
  custom_dev_fee: number;
  total: number;
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
  revenue_breakdown: RevenueBreakdown;
  won_revenue_breakdown: RevenueBreakdown;
  pipeline_revenue_breakdown: RevenueBreakdown;
  monthly_revenue: MonthlyRevenueData[];
};

export async function getReportData(): Promise<ActionResponse<ReportSummary>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) {
      console.error("[reports] No workspace context found");
      return { success: false, error: "No workspace found" };
    }

    const admin = createAdminClient();

    // Fetch all deals with stage info via explicit FK
    // Try full query with revenue columns first; fall back if columns don't exist yet
    const dealsResult = await admin
      .from("deals")
      .select("id, value, audit_fee, retainer_monthly, custom_dev_fee, revenue_start_date, revenue_end_date, source, created_at, closed_at, stage_id, pipeline_stages!deals_stage_id_fkey(name, color, is_won, is_lost, display_order)")
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null);

    let deals: typeof dealsResult.data = null;

    if (dealsResult.error) {
      // If the error is about missing columns, try without revenue columns
      if (dealsResult.error.message.includes("schema cache") || dealsResult.error.message.includes("column")) {
        console.warn("[reports] Revenue columns not found, querying without them:", dealsResult.error.message);
        const fallbackResult = await admin
          .from("deals")
          .select("id, value, source, created_at, closed_at, stage_id, pipeline_stages!deals_stage_id_fkey(name, color, is_won, is_lost, display_order)")
          .eq("workspace_id", ctx.workspaceId)
          .is("deleted_at", null);

        if (fallbackResult.error) {
          console.error("[reports] Fallback deals query error:", fallbackResult.error.message);
          return { success: false, error: fallbackResult.error.message };
        }
        // Add default values for missing revenue columns
        deals = (fallbackResult.data ?? []).map((d) => ({
          ...d,
          audit_fee: 0,
          retainer_monthly: 0,
          custom_dev_fee: 0,
          revenue_start_date: null,
          revenue_end_date: null,
        })) as unknown as typeof dealsResult.data;
      } else {
        console.error("[reports] Deals query error:", dealsResult.error.message);
        return { success: false, error: dealsResult.error.message };
      }
    } else {
      deals = dealsResult.data;
    }

    const allDeals = deals ?? [];

    console.log("[reports] Fetched", allDeals.length, "deals for workspace", ctx.workspaceId);
    if (allDeals.length > 0) {
      const firstDeal = allDeals[0];
      console.log("[reports] Sample deal stage join:", JSON.stringify(firstDeal.pipeline_stages));
    }

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

    // --- Revenue Breakdown ---
    const sumBreakdown = (deals: typeof allDeals): RevenueBreakdown => ({
      audit_fee: deals.reduce((s, d) => s + Number(d.audit_fee ?? 0), 0),
      retainer_monthly: deals.reduce((s, d) => s + Number(d.retainer_monthly ?? 0), 0),
      custom_dev_fee: deals.reduce((s, d) => s + Number(d.custom_dev_fee ?? 0), 0),
    });

    const revenue_breakdown = sumBreakdown(allDeals);
    const won_revenue_breakdown = sumBreakdown(wonDeals);
    const pipeline_revenue_breakdown = sumBreakdown(openDeals);

    // --- Monthly Revenue (last 12 months) ---
    // Fetch all revenue item amendments for the workspace (table may not exist yet)
    const amendmentMap = new Map<string, number>();
    try {
      const { data: revenueItems } = await admin
        .from("deal_revenue_items")
        .select("deal_id, month, item_type, amount")
        .eq("workspace_id", ctx.workspaceId);

      for (const ri of revenueItems ?? []) {
        amendmentMap.set(`${ri.deal_id}|${ri.month}|${ri.item_type}`, Number(ri.amount));
      }
    } catch {
      console.warn("[reports] deal_revenue_items table not accessible, skipping amendments");
    }

    // Only consider won deals with revenue dates for monthly tracking
    const revenueDeals = wonDeals.filter((d) => d.revenue_start_date);

    const monthly_revenue: MonthlyRevenueData[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-01`;
      const monthLabel = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      let retainer = 0;
      let audit = 0;
      let customDev = 0;

      for (const deal of revenueDeals) {
        const startDate = deal.revenue_start_date as string;
        const endDate = (deal.revenue_end_date as string | null) ?? monthStr; // Use current month as upper bound if no end

        // Check if this month is within the deal's revenue range
        if (monthStr < startDate || monthStr > endDate) continue;

        // Determine if it's the first month of the deal
        const isFirstMonth = monthStr === startDate;

        // Retainer: amendment or default
        const retainerKey = `${deal.id}|${monthStr}|retainer`;
        retainer += amendmentMap.has(retainerKey)
          ? amendmentMap.get(retainerKey)!
          : Number(deal.retainer_monthly ?? 0);

        // Audit: amendment or first-month default
        const auditKey = `${deal.id}|${monthStr}|audit_fee`;
        audit += amendmentMap.has(auditKey)
          ? amendmentMap.get(auditKey)!
          : isFirstMonth ? Number(deal.audit_fee ?? 0) : 0;

        // Custom dev: amendment or first-month default
        const customDevKey = `${deal.id}|${monthStr}|custom_dev_fee`;
        customDev += amendmentMap.has(customDevKey)
          ? amendmentMap.get(customDevKey)!
          : isFirstMonth ? Number(deal.custom_dev_fee ?? 0) : 0;
      }

      monthly_revenue.push({
        month: monthLabel,
        retainer,
        audit_fee: audit,
        custom_dev_fee: customDev,
        total: retainer + audit + customDev,
      });
    }

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
        revenue_breakdown,
        won_revenue_breakdown,
        pipeline_revenue_breakdown,
        monthly_revenue,
      },
    };
  } catch (err) {
    console.error("Report error:", err);
    return { success: false, error: "Failed to generate report data" };
  }
}
