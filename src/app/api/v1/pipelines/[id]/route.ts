/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";
import { z } from "zod";

const updatePipelineSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
});

// PATCH /api/v1/pipelines/:id
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updatePipelineSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("pipelines") as any)
    .update(parsed.data)
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Pipeline");
  return apiSuccess(data);
});

// DELETE /api/v1/pipelines/:id (archive)
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();

  // Check for active deals
  const { count } = await admin
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("pipeline_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null);

  if (count && count > 0)
    return apiError("Cannot archive pipeline with active deals. Move or delete deals first.", 400);

  const { data, error } = await (admin.from("pipelines") as any)
    .update({ is_archived: true })
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error || !data) return apiNotFound("Pipeline");
  return apiSuccess({ id: params.id, archived: true });
});
