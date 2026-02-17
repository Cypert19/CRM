/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createContactSchema } from "@/validators/contacts";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/contacts
export const GET = withApiAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");

  const admin = createAdminClient();
  let query = admin
    .from("contacts")
    .select("*, companies(id, company_name)")
    .eq("workspace_id", ctx.workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/contacts
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("contacts") as any)
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
    activity_type: "contact_created",
    actor_id: ctx.createdByUserId,
    entity_type: "Contact",
    entity_id: data.id,
    metadata: { name: `${data.first_name} ${data.last_name}`, via: "api" },
  });

  return apiSuccess(data, 201);
});
