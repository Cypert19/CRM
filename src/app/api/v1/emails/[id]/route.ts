/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiNotFound } from "@/lib/api/response";

// GET /api/v1/emails/:id
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_logs")
    .select("*, users!email_logs_sender_id_fkey(id, full_name), contacts(id, first_name, last_name, email), deals(id, title), companies(id, company_name)")
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .single();

  if (error) return apiNotFound("Email");
  return apiSuccess(data);
});
