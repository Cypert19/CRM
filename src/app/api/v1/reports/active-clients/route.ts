/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/reports/active-clients
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();

  // Get won deals with relations
  const { data: stages } = await admin
    .from("pipeline_stages")
    .select("id")
    .eq("workspace_id", ctx.workspaceId)
    .eq("is_won", true);

  const wonStageIds = (stages ?? []).map((s) => s.id);

  if (wonStageIds.length === 0) return apiSuccess({ deals: [], totals: { count: 0, total_value: 0 } });

  const { data: deals } = await admin
    .from("deals")
    .select("id, title, value, audit_fee, retainer_monthly, custom_dev_fee, closed_at, contacts(id, first_name, last_name, email), companies(id, company_name)")
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .in("stage_id", wonStageIds)
    .order("closed_at", { ascending: false });

  return apiSuccess({
    deals: deals ?? [],
    totals: {
      count: (deals ?? []).length,
      total_value: (deals ?? []).reduce((s, d) => s + (d.value ?? 0), 0),
    },
  });
});
