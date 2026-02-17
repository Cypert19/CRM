/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/reports
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();

  // Get pipeline stages with deal counts and values
  const { data: stages } = await admin
    .from("pipeline_stages")
    .select("id, name, color, display_order, is_won, is_lost")
    .eq("workspace_id", ctx.workspaceId)
    .order("display_order", { ascending: true });

  // Get deal summary data
  const { data: deals } = await admin
    .from("deals")
    .select("id, title, value, stage_id, pipeline_id, created_at, closed_at, expected_close_date, priority")
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null);

  // Count by stage
  const stageSummary = (stages ?? []).map((stage) => {
    const stageDeals = (deals ?? []).filter((d) => d.stage_id === stage.id);
    return {
      ...stage,
      deal_count: stageDeals.length,
      total_value: stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
    };
  });

  // Win/loss counts
  const wonStageIds = (stages ?? []).filter((s) => s.is_won).map((s) => s.id);
  const lostStageIds = (stages ?? []).filter((s) => s.is_lost).map((s) => s.id);
  const wonDeals = (deals ?? []).filter((d) => wonStageIds.includes(d.stage_id));
  const lostDeals = (deals ?? []).filter((d) => lostStageIds.includes(d.stage_id));
  const openDeals = (deals ?? []).filter(
    (d) => !wonStageIds.includes(d.stage_id) && !lostStageIds.includes(d.stage_id)
  );

  return apiSuccess({
    stages: stageSummary,
    summary: {
      total_deals: (deals ?? []).length,
      open_deals: openDeals.length,
      won_deals: wonDeals.length,
      lost_deals: lostDeals.length,
      total_pipeline_value: openDeals.reduce((s, d) => s + (d.value ?? 0), 0),
      total_won_value: wonDeals.reduce((s, d) => s + (d.value ?? 0), 0),
      win_rate: wonDeals.length + lostDeals.length > 0
        ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
        : 0,
    },
  });
});
