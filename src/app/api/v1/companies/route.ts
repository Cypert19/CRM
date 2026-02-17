/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createCompanySchema } from "@/validators/companies";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/companies
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/companies
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("companies") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      owner_id: ctx.createdByUserId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "company_created",
    actor_id: ctx.createdByUserId,
    entity_type: "Company",
    entity_id: data.id,
    metadata: { name: data.company_name, via: "api" },
  });

  return apiSuccess(data, 201);
});
