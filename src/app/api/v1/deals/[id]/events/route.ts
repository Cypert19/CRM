/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createDealEventSchema } from "@/validators/deal-events";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/deals/:id/events
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deal_events")
    .select("*, users!deal_events_creator_id_fkey(id, full_name)")
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .order("start_time", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/deals/:id/events
export const POST = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = createDealEventSchema.safeParse({ ...body, deal_id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("deal_events") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      creator_id: ctx.createdByUserId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data, 201);
});
