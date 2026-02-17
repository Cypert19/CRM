/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const createStageSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().max(10).default("#6366f1"),
  display_order: z.number().int().min(0).default(0),
  default_probability: z.number().int().min(0).max(100).default(0),
  is_won: z.boolean().default(false),
  is_lost: z.boolean().default(false),
});

// GET /api/v1/pipelines/:id/stages
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pipeline_stages")
    .select("*")
    .eq("pipeline_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .order("display_order", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/pipelines/:id/stages
export const POST = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = createStageSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("pipeline_stages") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      pipeline_id: params.id,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data, 201);
});
