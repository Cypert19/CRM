/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createDealSchema } from "@/validators/deals";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/deals?pipeline_id=xxx
export const GET = withApiAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const pipelineId = searchParams.get("pipeline_id");

  const admin = createAdminClient();
  let query = admin
    .from("deals")
    .select(
      "*, contacts(id, first_name, last_name, email), companies(id, company_name), users!deals_owner_id_fkey(id, full_name, avatar_url), pipeline_stages!deals_stage_id_fkey(id, name, color, is_won, is_lost)"
    )
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (pipelineId) query = query.eq("pipeline_id", pipelineId);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/deals
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = createDealSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("deals") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      owner_id: ctx.createdByUserId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "deal_created",
    actor_id: ctx.createdByUserId,
    entity_type: "Deal",
    entity_id: data.id,
    metadata: { title: data.title, value: data.value, via: "api" },
  });

  return apiSuccess(data, 201);
});
