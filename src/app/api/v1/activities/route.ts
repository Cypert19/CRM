/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/activities?entity_type=Deal&entity_id=xxx&limit=50
export const GET = withApiAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const admin = createAdminClient();
  let query = admin
    .from("activities")
    .select("*, users!activities_actor_id_fkey(id, full_name, avatar_url)")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
