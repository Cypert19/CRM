/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/files?entity_type=Deal&entity_id=xxx
export const GET = withApiAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  const admin = createAdminClient();
  let query = admin
    .from("files")
    .select("id, original_filename, storage_path, mime_type, file_size_bytes, category, description, uploaded_by, deal_id, contact_id, company_id, created_at")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (entityType === "Deal" && entityId) query = query.eq("deal_id", entityId);
  if (entityType === "Contact" && entityId) query = query.eq("contact_id", entityId);
  if (entityType === "Company" && entityId) query = query.eq("company_id", entityId);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
