/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// GET /api/v1/deals/:id/revenue
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();

  // Get the deal
  const { data: deal, error: dealErr } = await admin
    .from("deals")
    .select("id, title, value, audit_fee, retainer_monthly, custom_dev_fee, revenue_start_date, revenue_end_date")
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .single();

  if (dealErr || !deal) return apiNotFound("Deal");

  // Get revenue items (amendments)
  const { data: items, error: itemsErr } = await admin
    .from("deal_revenue_items")
    .select("*")
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .order("month", { ascending: true });

  if (itemsErr) return apiError(itemsErr.message, 500);

  return apiSuccess({
    deal: {
      id: deal.id,
      title: deal.title,
      value: deal.value,
      audit_fee: deal.audit_fee,
      retainer_monthly: deal.retainer_monthly,
      custom_dev_fee: deal.custom_dev_fee,
      revenue_start_date: deal.revenue_start_date,
      revenue_end_date: deal.revenue_end_date,
    },
    items: items ?? [],
  });
});
