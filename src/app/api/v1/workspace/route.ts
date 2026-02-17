/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiNotFound } from "@/lib/api/response";

// GET /api/v1/workspace
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspaces")
    .select("*")
    .eq("id", ctx.workspaceId)
    .single();

  if (error) return apiNotFound("Workspace");
  return apiSuccess(data);
});
