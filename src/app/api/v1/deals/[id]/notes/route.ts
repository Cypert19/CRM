/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/deals/:id/notes
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notes")
    .select("*, users!notes_author_id_fkey(id, full_name, avatar_url)")
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
