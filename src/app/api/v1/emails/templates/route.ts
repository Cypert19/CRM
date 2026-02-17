/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createEmailTemplateSchema } from "@/validators/emails";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/emails/templates
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_templates")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/emails/templates
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = createEmailTemplateSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("email_templates") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      created_by: ctx.createdByUserId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data, 201);
});
