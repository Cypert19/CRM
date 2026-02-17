/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const createPipelineSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
});

// GET /api/v1/pipelines
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pipelines")
    .select("*, pipeline_stages(id, name, color, display_order, default_probability, is_won, is_lost)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/pipelines
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = createPipelineSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data: pipeline, error } = await (admin.from("pipelines") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  // Create default Won and Lost stages
  await (admin.from("pipeline_stages") as any).insert([
    {
      workspace_id: ctx.workspaceId,
      pipeline_id: pipeline.id,
      name: "Won",
      color: "#22c55e",
      display_order: 98,
      default_probability: 100,
      is_won: true,
    },
    {
      workspace_id: ctx.workspaceId,
      pipeline_id: pipeline.id,
      name: "Lost",
      color: "#ef4444",
      display_order: 99,
      default_probability: 0,
      is_lost: true,
    },
  ]);

  return apiSuccess(pipeline, 201);
});
