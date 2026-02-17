/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/deals/:id/files
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("files")
    .select("id, original_filename, storage_path, mime_type, file_size_bytes, category, description, uploaded_by, created_at")
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
