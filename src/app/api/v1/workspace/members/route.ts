/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/workspace/members
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspace_members")
    .select("*, users(id, full_name, email, avatar_url)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "Active")
    .order("created_at", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
