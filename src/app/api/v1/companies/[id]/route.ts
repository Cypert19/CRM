/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { updateCompanySchema } from "@/validators/companies";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// GET /api/v1/companies/:id
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .select("*")
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .single();

  if (error) return apiNotFound("Company");
  return apiSuccess(data);
});

// PATCH /api/v1/companies/:id
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updateCompanySchema.safeParse({ ...body, id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("companies") as any)
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Company");

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "company_updated",
    actor_id: ctx.createdByUserId,
    entity_type: "Company",
    entity_id: id,
    metadata: { name: data.company_name, via: "api" },
  });

  return apiSuccess(data);
});

// DELETE /api/v1/companies/:id (soft delete)
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await (admin.from("companies") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .select("id, company_name")
    .single();

  if (error || !data) return apiNotFound("Company");

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "company_updated",
    actor_id: ctx.createdByUserId,
    entity_type: "Company",
    entity_id: params.id,
    metadata: { name: data.company_name, action: "deleted", via: "api" },
  });

  return apiSuccess({ id: params.id, deleted: true });
});
