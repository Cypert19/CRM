/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const addDealContactSchema = z.object({
  contact_id: z.string().uuid(),
  role: z.enum(["Decision Maker", "Champion", "Influencer", "Blocker", "End User"]).nullable().optional(),
  is_primary: z.boolean().default(false),
});

// GET /api/v1/deals/:id/contacts
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deal_contacts")
    .select("*, contacts(id, first_name, last_name, email, phone, job_title)")
    .eq("deal_id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/deals/:id/contacts
export const POST = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = addDealContactSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();

  // Check for duplicate
  const { data: existing } = await admin
    .from("deal_contacts")
    .select("id")
    .eq("deal_id", params.id)
    .eq("contact_id", parsed.data.contact_id)
    .eq("workspace_id", ctx.workspaceId)
    .maybeSingle();

  if (existing) return apiError("Contact is already linked to this deal", 400);

  const { data, error } = await (admin.from("deal_contacts") as any)
    .insert({
      workspace_id: ctx.workspaceId,
      deal_id: params.id,
      contact_id: parsed.data.contact_id,
      role: parsed.data.role,
      is_primary: parsed.data.is_primary,
    })
    .select("*, contacts(id, first_name, last_name, email)")
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data, 201);
});
