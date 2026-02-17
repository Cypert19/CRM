/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertRevenueItemSchema, deleteRevenueItemSchema } from "@/validators/deals";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// PUT /api/v1/deals/:id/revenue/items (upsert)
export const PUT = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = upsertRevenueItemSchema.safeParse({ ...body, deal_id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("deal_revenue_items") as any)
    .upsert(
      {
        workspace_id: ctx.workspaceId,
        deal_id: parsed.data.deal_id,
        month: parsed.data.month,
        item_type: parsed.data.item_type,
        amount: parsed.data.amount,
        notes: parsed.data.notes ?? null,
        created_by: ctx.createdByUserId,
      },
      { onConflict: "deal_id,month,item_type" }
    )
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// DELETE /api/v1/deals/:id/revenue/items
export const DELETE = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = deleteRevenueItemSchema.safeParse({ ...body, deal_id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { error } = await admin
    .from("deal_revenue_items")
    .delete()
    .eq("deal_id", parsed.data.deal_id)
    .eq("month", parsed.data.month)
    .eq("item_type", parsed.data.item_type)
    .eq("workspace_id", ctx.workspaceId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ deleted: true });
});
