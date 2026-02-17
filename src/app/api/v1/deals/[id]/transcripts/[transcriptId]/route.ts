/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTranscriptSchema } from "@/validators/transcripts";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// PATCH /api/v1/deals/:id/transcripts/:transcriptId
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updateTranscriptSchema.safeParse({ ...body, id: params.transcriptId });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("deal_transcripts") as any)
    .update(updates)
    .eq("id", id)
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Transcript");
  return apiSuccess(data);
});

// DELETE /api/v1/deals/:id/transcripts/:transcriptId
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { error } = await admin
    .from("deal_transcripts")
    .delete()
    .eq("id", params.transcriptId)
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ id: params.transcriptId, deleted: true });
});
