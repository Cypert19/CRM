/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createTranscriptSchema } from "@/validators/transcripts";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/deals/:id/transcripts
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deal_transcripts")
    .select("*, users!deal_transcripts_created_by_fkey(id, full_name)")
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/deals/:id/transcripts
export const POST = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = createTranscriptSchema.safeParse({ ...body, deal_id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("deal_transcripts") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      created_by: ctx.createdByUserId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data, 201);
});
