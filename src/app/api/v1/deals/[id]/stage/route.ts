/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { moveDealStageSchema } from "@/validators/deals";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// PATCH /api/v1/deals/:id/stage
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = moveDealStageSchema.safeParse({ ...body, id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();

  // Get the target stage to check if it's won/lost
  const { data: stage } = await admin
    .from("pipeline_stages")
    .select("id, name, is_won, is_lost")
    .eq("id", parsed.data.stage_id)
    .single();

  if (!stage) return apiNotFound("Pipeline stage");

  const updates: Record<string, unknown> = {
    stage_id: parsed.data.stage_id,
  };

  if (stage.is_won || stage.is_lost) {
    updates.closed_at = new Date().toISOString();
  }
  if (stage.is_lost && parsed.data.lost_reason) {
    updates.lost_reason = parsed.data.lost_reason;
  }

  const { data, error } = await (admin.from("deals") as any)
    .update(updates)
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error || !data) return apiNotFound("Deal");

  const activityType = stage.is_won
    ? "deal_won"
    : stage.is_lost
      ? "deal_lost"
      : "deal_stage_changed";

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: activityType,
    actor_id: ctx.createdByUserId,
    entity_type: "Deal",
    entity_id: params.id,
    metadata: {
      title: data.title,
      stage_name: stage.name,
      via: "api",
    },
  });

  return apiSuccess(data);
});
