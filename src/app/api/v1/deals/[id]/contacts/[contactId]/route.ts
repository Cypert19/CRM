/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";
import { z } from "zod";

const updateDealContactSchema = z.object({
  role: z.enum(["Decision Maker", "Champion", "Influencer", "Blocker", "End User"]).nullable().optional(),
  is_primary: z.boolean().optional(),
});

// PATCH /api/v1/deals/:id/contacts/:contactId
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updateDealContactSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("deal_contacts") as any)
    .update(parsed.data)
    .eq("id", params.contactId)
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Deal contact");
  return apiSuccess(data);
});

// DELETE /api/v1/deals/:id/contacts/:contactId
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { error } = await admin
    .from("deal_contacts")
    .delete()
    .eq("id", params.contactId)
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ id: params.contactId, deleted: true });
});
