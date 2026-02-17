/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";
import { z } from "zod";

const updateStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().max(10).optional(),
  display_order: z.number().int().min(0).optional(),
  default_probability: z.number().int().min(0).max(100).optional(),
  is_won: z.boolean().optional(),
  is_lost: z.boolean().optional(),
});

// PATCH /api/v1/pipelines/:id/stages/:stageId
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updateStageSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("pipeline_stages") as any)
    .update(parsed.data)
    .eq("id", params.stageId)
    .eq("pipeline_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Pipeline stage");
  return apiSuccess(data);
});

// DELETE /api/v1/pipelines/:id/stages/:stageId
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();

  // Check for deals using this stage
  const { count } = await admin
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", params.stageId)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null);

  if (count && count > 0)
    return apiError("Cannot delete stage with active deals", 400);

  const { error } = await admin
    .from("pipeline_stages")
    .delete()
    .eq("id", params.stageId)
    .eq("pipeline_id", params.id)
    .eq("workspace_id", ctx.workspaceId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ id: params.stageId, deleted: true });
});
