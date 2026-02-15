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

// ============================================================
// Team Productivity (Admin-Only)
// ============================================================

export type OverdueTaskItem = {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  deal_title: string | null;
  days_overdue: number;
};

export type MemberProductivity = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
  overdue_task_list: OverdueTaskItem[];
  avg_completion_minutes: number;
  total_focus_minutes: number;
  tasks_with_focus_data: number;
  completion_rate: number;
  avg_days_to_complete: number;
  on_time_rate: number;
};

export type TeamProductivityData = {
  members: MemberProductivity[];
  team_totals: {
    total_overdue: number;
    total_completed: number;
    total_tasks: number;
    avg_completion_rate: number;
    avg_focus_minutes: number;
  };
};

export async function getTeamProductivityData(): Promise<ActionResponse<TeamProductivityData>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Fetch all active workspace members with user info
    const { data: members, error: membersError } = await admin
      .from("workspace_members")
      .select("user_id, users(id, full_name, avatar_url)")
      .eq("workspace_id", ctx.workspaceId)
      .eq("status", "Active");

    if (membersError) return { success: false, error: membersError.message };

    // Fetch all tasks with deal info
    const { data: tasks, error: tasksError } = await admin
      .from("tasks")
      .select("id, title, status, priority, due_date, assignee_id, completed_at, actual_minutes, created_at, deals!tasks_deal_id_fkey(id, title)")
      .eq("workspace_id", ctx.workspaceId);

    if (tasksError) return { success: false, error: tasksError.message };

    const allTasks = tasks ?? [];
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const memberProductivity: MemberProductivity[] = (members ?? []).map((m) => {
      const user = m.users as unknown as { id: string; full_name: string; avatar_url: string | null } | null;
      const userId = m.user_id;
      const memberTasks = allTasks.filter((t) => t.assignee_id === userId);

      const completedTasks = memberTasks.filter((t) => t.status === "Done");
      const overdueTasks = memberTasks.filter(
        (t) => t.due_date && t.due_date < today && t.status !== "Done" && t.status !== "Cancelled"
      );
      const inProgressTasks = memberTasks.filter((t) => t.status === "In Progress");

      // Overdue detail list
      const overdue_task_list: OverdueTaskItem[] = overdueTasks
        .map((t) => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date!,
          priority: t.priority,
          deal_title: (t.deals as unknown as { title: string } | null)?.title ?? null,
          days_overdue: Math.floor((new Date(today).getTime() - new Date(t.due_date!).getTime()) / (1000 * 60 * 60 * 24)),
        }))
        .sort((a, b) => b.days_overdue - a.days_overdue);

      // Focus time metrics
      const tasksWithFocus = completedTasks.filter((t) => t.actual_minutes && t.actual_minutes > 0);
      const totalFocusMinutes = tasksWithFocus.reduce((s, t) => s + (t.actual_minutes ?? 0), 0);
      const avgCompletionMinutes = tasksWithFocus.length > 0
        ? Math.round(totalFocusMinutes / tasksWithFocus.length)
        : 0;

      // Avg days to complete (created_at → completed_at)
      const tasksWithCompletion = completedTasks.filter((t) => t.completed_at);
      const avgDaysToComplete = tasksWithCompletion.length > 0
        ? Math.round(
            tasksWithCompletion.reduce((s, t) => {
              const created = new Date(t.created_at);
              const completed = new Date(t.completed_at!);
              return s + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / tasksWithCompletion.length
          )
        : 0;

      // On-time rate: % of completed tasks that were completed before/on due date
      const completedWithDue = completedTasks.filter((t) => t.due_date && t.completed_at);
      const onTimeTasks = completedWithDue.filter(
        (t) => t.completed_at!.slice(0, 10) <= t.due_date!
      );
      const onTimeRate = completedWithDue.length > 0
        ? Math.round((onTimeTasks.length / completedWithDue.length) * 100)
        : 0;

      const completionRate = memberTasks.length > 0
        ? Math.round((completedTasks.length / memberTasks.length) * 100)
        : 0;

      return {
        user_id: userId,
        full_name: user?.full_name ?? "Unknown",
        avatar_url: user?.avatar_url ?? null,
        total_tasks: memberTasks.length,
        completed_tasks: completedTasks.length,
        overdue_tasks: overdueTasks.length,
        in_progress_tasks: inProgressTasks.length,
        overdue_task_list,
        avg_completion_minutes: avgCompletionMinutes,
        total_focus_minutes: totalFocusMinutes,
        tasks_with_focus_data: tasksWithFocus.length,
        completion_rate: completionRate,
        avg_days_to_complete: avgDaysToComplete,
        on_time_rate: onTimeRate,
      };
    });

    // Sort by overdue count descending
    memberProductivity.sort((a, b) => b.overdue_tasks - a.overdue_tasks);

    const totalOverdue = memberProductivity.reduce((s, m) => s + m.overdue_tasks, 0);
    const totalCompleted = memberProductivity.reduce((s, m) => s + m.completed_tasks, 0);
    const totalTasks = memberProductivity.reduce((s, m) => s + m.total_tasks, 0);
    const avgCompletionRate = memberProductivity.length > 0
      ? Math.round(memberProductivity.reduce((s, m) => s + m.completion_rate, 0) / memberProductivity.length)
      : 0;
    const avgFocus = memberProductivity.filter((m) => m.tasks_with_focus_data > 0);
    const avgFocusMinutes = avgFocus.length > 0
      ? Math.round(avgFocus.reduce((s, m) => s + m.avg_completion_minutes, 0) / avgFocus.length)
      : 0;

    return {
      success: true,
      data: {
        members: memberProductivity,
        team_totals: {
          total_overdue: totalOverdue,
          total_completed: totalCompleted,
          total_tasks: totalTasks,
          avg_completion_rate: avgCompletionRate,
          avg_focus_minutes: avgFocusMinutes,
        },
      },
    };
  } catch (err) {
    console.error("Productivity report error:", err);
    return { success: false, error: "Failed to generate productivity data" };
  }
}

// ============================================================
// Active Clients (Won-Stage Deals)
// ============================================================

export type ActiveClientDeal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage_name: string;
  stage_color: string;
  stage_display_order: number;
  owner_name: string;
  owner_avatar: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  closed_at: string | null;
  days_since_won: number;
  payment_type: string | null;
  payment_frequency: string | null;
  audit_fee: number;
  retainer_monthly: number;
  custom_dev_fee: number;
  monthly_revenue: number;
  next_step: string | null;
  priority: string | null;
  services_description: string | null;
  task_count: number;
  overdue_task_count: number;
};

export type ActiveClientsStage = {
  name: string;
  color: string;
  display_order: number;
  deal_count: number;
  total_value: number;
};

export type ActiveClientsData = {
  deals: ActiveClientDeal[];
  stages: ActiveClientsStage[];
  totals: {
    total_deals: number;
    total_monthly_revenue: number;
    total_value: number;
    avg_days_active: number;
  };
};

export async function getActiveClientsData(): Promise<ActionResponse<ActiveClientsData>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Fetch all won-stage deals with relations
    const { data: wonStages, error: stagesError } = await admin
      .from("pipeline_stages")
      .select("id, name, color, display_order")
      .eq("workspace_id", ctx.workspaceId)
      .eq("is_won", true)
      .order("display_order", { ascending: true });

    if (stagesError) return { success: false, error: stagesError.message };
    if (!wonStages || wonStages.length === 0) {
      return { success: true, data: { deals: [], stages: [], totals: { total_deals: 0, total_monthly_revenue: 0, total_value: 0, avg_days_active: 0 } } };
    }

    const wonStageIds = wonStages.map((s) => s.id);

    const { data: deals, error: dealsError } = await admin
      .from("deals")
      .select(`
        id, title, value, currency, stage_id, closed_at, priority, next_step,
        payment_type, payment_frequency, services_description,
        audit_fee, retainer_monthly, custom_dev_fee,
        users!deals_owner_id_fkey(id, full_name, avatar_url),
        companies!deals_company_id_fkey(id, company_name),
        contacts!deals_contact_id_fkey(id, first_name, last_name, email)
      `)
      .eq("workspace_id", ctx.workspaceId)
      .in("stage_id", wonStageIds)
      .is("deleted_at", null)
      .order("closed_at", { ascending: true });

    if (dealsError) return { success: false, error: dealsError.message };

    // Fetch task counts per deal (total + overdue)
    const dealIds = (deals ?? []).map((d) => d.id);
    const tasksByDeal: Record<string, { total: number; overdue: number }> = {};

    if (dealIds.length > 0) {
      const { data: dealTasks } = await admin
        .from("tasks")
        .select("id, deal_id, status, due_date")
        .eq("workspace_id", ctx.workspaceId)
        .in("deal_id", dealIds);

      const today = new Date().toISOString().slice(0, 10);
      for (const t of dealTasks ?? []) {
        if (!t.deal_id) continue;
        if (!tasksByDeal[t.deal_id]) tasksByDeal[t.deal_id] = { total: 0, overdue: 0 };
        tasksByDeal[t.deal_id].total += 1;
        if (t.due_date && t.due_date < today && t.status !== "Done" && t.status !== "Cancelled") {
          tasksByDeal[t.deal_id].overdue += 1;
        }
      }
    }

    const now = new Date();
    const stageMap = new Map<string, { name: string; color: string; display_order: number }>();
    for (const s of wonStages) stageMap.set(s.id, s);

    const activeDeals: ActiveClientDeal[] = (deals ?? []).map((d) => {
      const stage = stageMap.get(d.stage_id);
      const owner = d.users as unknown as { full_name: string; avatar_url: string | null } | null;
      const company = d.companies as unknown as { company_name: string } | null;
      const contact = d.contacts as unknown as { first_name: string; last_name: string; email: string | null } | null;
      const daysSinceWon = d.closed_at
        ? Math.floor((now.getTime() - new Date(d.closed_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const retainer = Number(d.retainer_monthly ?? 0);

      return {
        id: d.id,
        title: d.title,
        value: Number(d.value),
        currency: d.currency,
        stage_name: stage?.name ?? "Won",
        stage_color: stage?.color ?? "#10B981",
        stage_display_order: stage?.display_order ?? 0,
        owner_name: owner?.full_name ?? "Unassigned",
        owner_avatar: owner?.avatar_url ?? null,
        company_name: company?.company_name ?? null,
        contact_name: contact ? `${contact.first_name} ${contact.last_name}`.trim() : null,
        contact_email: contact?.email ?? null,
        closed_at: d.closed_at,
        days_since_won: daysSinceWon,
        payment_type: d.payment_type,
        payment_frequency: d.payment_frequency,
        audit_fee: Number(d.audit_fee ?? 0),
        retainer_monthly: retainer,
        custom_dev_fee: Number(d.custom_dev_fee ?? 0),
        monthly_revenue: retainer,
        next_step: d.next_step,
        priority: d.priority,
        services_description: d.services_description,
        task_count: tasksByDeal[d.id]?.total ?? 0,
        overdue_task_count: tasksByDeal[d.id]?.overdue ?? 0,
      };
    });

    // Build stage summary
    const stageSummary: ActiveClientsStage[] = wonStages.map((s) => {
      const stageDeals = activeDeals.filter((d) => d.stage_name === s.name);
      return {
        name: s.name,
        color: s.color,
        display_order: s.display_order,
        deal_count: stageDeals.length,
        total_value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
    });

    const totalMonthlyRevenue = activeDeals.reduce((s, d) => s + d.monthly_revenue, 0);
    const totalValue = activeDeals.reduce((s, d) => s + d.value, 0);
    const avgDaysActive = activeDeals.length > 0
      ? Math.round(activeDeals.reduce((s, d) => s + d.days_since_won, 0) / activeDeals.length)
      : 0;

    return {
      success: true,
      data: {
        deals: activeDeals,
        stages: stageSummary,
        totals: {
          total_deals: activeDeals.length,
          total_monthly_revenue: totalMonthlyRevenue,
          total_value: totalValue,
          avg_days_active: avgDaysActive,
        },
      },
    };
  } catch (err) {
    console.error("Active clients report error:", err);
    return { success: false, error: "Failed to generate active clients data" };
  }
}
