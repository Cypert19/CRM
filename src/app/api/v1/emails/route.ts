/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSchema } from "@/validators/emails";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/emails?contact_id=&deal_id=
export const GET = withApiAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contact_id");
  const dealId = searchParams.get("deal_id");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const admin = createAdminClient();
  let query = admin
    .from("email_logs")
    .select("*, users!email_logs_sender_id_fkey(id, full_name)")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 100));

  if (contactId) query = query.eq("contact_id", contactId);
  if (dealId) query = query.eq("deal_id", dealId);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/emails (send)
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = sendEmailSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();

  // Get sender info
  const { data: sender } = await admin
    .from("users")
    .select("email, full_name")
    .eq("id", ctx.createdByUserId)
    .single();

  if (!sender) return apiError("Sender user not found", 500);

  // Create email log record
  const { data, error } = await (admin.from("email_logs") as any)
    .insert({
      workspace_id: ctx.workspaceId,
      sender_id: ctx.createdByUserId,
      from_email: sender.email,
      from_name: sender.full_name,
      to_emails: parsed.data.to_emails,
      cc_emails: parsed.data.cc_emails,
      bcc_emails: parsed.data.bcc_emails,
      subject: parsed.data.subject,
      body_html: parsed.data.body_html,
      body_text: parsed.data.body_text,
      contact_id: parsed.data.contact_id ?? null,
      deal_id: parsed.data.deal_id ?? null,
      company_id: parsed.data.company_id ?? null,
      template_id: parsed.data.template_id ?? null,
      tags: parsed.data.tags,
      status: "sent",
      direction: "outbound",
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  // Log activity
  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "email_logged",
    actor_id: ctx.createdByUserId,
    entity_type: "Email",
    entity_id: data.id,
    metadata: { subject: data.subject, to: parsed.data.to_emails, via: "api" },
  });

  return apiSuccess(data, 201);
});
