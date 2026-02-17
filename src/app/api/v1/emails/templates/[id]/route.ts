/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { updateEmailTemplateSchema } from "@/validators/emails";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// PATCH /api/v1/emails/templates/:id
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updateEmailTemplateSchema.safeParse({ ...body, id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("email_templates") as any)
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Email template");
  return apiSuccess(data);
});

// DELETE /api/v1/emails/templates/:id
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { error } = await admin
    .from("email_templates")
    .delete()
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ id: params.id, deleted: true });
});
