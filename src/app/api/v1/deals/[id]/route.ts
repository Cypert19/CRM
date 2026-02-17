/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { updateDealSchema } from "@/validators/deals";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// GET /api/v1/deals/:id
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select(
      "*, contacts(id, first_name, last_name, email), companies(id, company_name), users!deals_owner_id_fkey(id, full_name, avatar_url), pipeline_stages!deals_stage_id_fkey(id, name, color, is_won, is_lost), pipelines(id, name)"
    )
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .single();

  if (error) return apiNotFound("Deal");
  return apiSuccess(data);
});

// PATCH /api/v1/deals/:id
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updateDealSchema.safeParse({ ...body, id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("deals") as any)
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Deal");

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "deal_updated",
    actor_id: ctx.createdByUserId,
    entity_type: "Deal",
    entity_id: id,
    metadata: { title: data.title, via: "api" },
  });

  return apiSuccess(data);
});

// DELETE /api/v1/deals/:id (soft delete)
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await (admin.from("deals") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .select("id, title")
    .single();

  if (error || !data) return apiNotFound("Deal");

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "deal_updated",
    actor_id: ctx.createdByUserId,
    entity_type: "Deal",
    entity_id: params.id,
    metadata: { title: data.title, action: "deleted", via: "api" },
  });

  return apiSuccess({ id: params.id, deleted: true });
});
