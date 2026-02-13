"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getDefaultFrom } from "@/lib/email/resend";
import { sendEmailSchema, createEmailTemplateSchema, updateEmailTemplateSchema } from "@/validators/emails";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type EmailLogWithRelations = Tables<"email_logs"> & {
  sender?: { id: string; full_name: string; avatar_url: string | null } | null;
  contacts?: { id: string; first_name: string; last_name: string; email: string | null } | null;
  deals?: { id: string; title: string } | null;
  companies?: { id: string; company_name: string } | null;
};

// ──────────────────────────────────────────────────────────────
// Send Email
// ──────────────────────────────────────────────────────────────

export async function sendCrmEmail(input: unknown): Promise<ActionResponse<Tables<"email_logs">>> {
  try {
    const parsed = sendEmailSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found. Please log out and log back in." };

    const admin = createAdminClient();

    // Get sender info
    const { data: sender } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", ctx.userId)
      .single();

    if (!sender) return { success: false, error: "Could not find sender information" };

    const defaultFrom = getDefaultFrom();
    const fromEmail = defaultFrom.email;
    const fromName = sender.full_name || defaultFrom.name;

    // 1. Create email_logs record with status='pending'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: emailLog, error: insertError } = await (admin.from("email_logs") as any)
      .insert({
        workspace_id: ctx.workspaceId,
        sender_id: ctx.userId,
        from_email: fromEmail,
        from_name: fromName,
        to_emails: parsed.data.to_emails,
        cc_emails: parsed.data.cc_emails,
        bcc_emails: parsed.data.bcc_emails,
        subject: parsed.data.subject,
        body_html: parsed.data.body_html,
        body_text: parsed.data.body_text || stripHtml(parsed.data.body_html),
        contact_id: parsed.data.contact_id || null,
        deal_id: parsed.data.deal_id || null,
        company_id: parsed.data.company_id || null,
        template_id: parsed.data.template_id || null,
        tags: parsed.data.tags,
        status: "pending",
        direction: "outbound",
      })
      .select()
      .single();

    if (insertError) return { success: false, error: insertError.message };

    // 2. Send via Resend
    try {
      const resend = getResendClient();
      const result = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: parsed.data.to_emails,
        cc: parsed.data.cc_emails.length > 0 ? parsed.data.cc_emails : undefined,
        bcc: parsed.data.bcc_emails.length > 0 ? parsed.data.bcc_emails : undefined,
        subject: parsed.data.subject,
        html: parsed.data.body_html,
        text: parsed.data.body_text || stripHtml(parsed.data.body_html),
      });

      if (result.error) {
        // Update status to failed
        await admin
          .from("email_logs")
          .update({ status: "failed", error_message: result.error.message })
          .eq("id", emailLog.id);
        return { success: false, error: `Email send failed: ${result.error.message}` };
      }

      // 3. Update status to sent
      await admin
        .from("email_logs")
        .update({
          status: "sent",
          external_id: result.data?.id || null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", emailLog.id);

    } catch (sendError) {
      const errMsg = sendError instanceof Error ? sendError.message : "Unknown send error";
      await admin
        .from("email_logs")
        .update({ status: "failed", error_message: errMsg })
        .eq("id", emailLog.id);
      return { success: false, error: `Email send failed: ${errMsg}` };
    }

    // 4. Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("activities") as any).insert({
      workspace_id: ctx.workspaceId,
      activity_type: "email_logged",
      actor_id: ctx.userId,
      entity_type: "Contact",
      entity_id: parsed.data.contact_id || null,
      metadata: {
        subject: parsed.data.subject,
        to: parsed.data.to_emails.join(", "),
        email_log_id: emailLog.id,
      },
    });

    // 5. Update contact's last_contacted_at if linked to a contact
    if (parsed.data.contact_id) {
      await admin
        .from("contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", parsed.data.contact_id);
    }

    // 6. Revalidate
    revalidatePath("/deals");
    revalidatePath("/contacts");
    if (parsed.data.deal_id) revalidatePath(`/deals/${parsed.data.deal_id}`);
    if (parsed.data.contact_id) revalidatePath(`/contacts/${parsed.data.contact_id}`);

    // Re-fetch the updated record
    const { data: updated } = await admin
      .from("email_logs")
      .select("*")
      .eq("id", emailLog.id)
      .single();

    return { success: true, data: updated || emailLog };
  } catch {
    return { success: false, error: "Failed to send email" };
  }
}

// ──────────────────────────────────────────────────────────────
// Email Queries
// ──────────────────────────────────────────────────────────────

export async function getEmails(opts?: {
  contact_id?: string;
  deal_id?: string;
  company_id?: string;
  limit?: number;
}): Promise<ActionResponse<EmailLogWithRelations[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    let query = admin
      .from("email_logs")
      .select(`
        *,
        sender:users!email_logs_sender_id_fkey(id, full_name, avatar_url),
        contacts!email_logs_contact_id_fkey(id, first_name, last_name, email),
        deals!email_logs_deal_id_fkey(id, title),
        companies!email_logs_company_id_fkey(id, company_name)
      `)
      .eq("workspace_id", ctx.workspaceId)
      .order("created_at", { ascending: false });

    if (opts?.contact_id) query = query.eq("contact_id", opts.contact_id);
    if (opts?.deal_id) query = query.eq("deal_id", opts.deal_id);
    if (opts?.company_id) query = query.eq("company_id", opts.company_id);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as EmailLogWithRelations[] };
  } catch {
    return { success: false, error: "Failed to fetch emails" };
  }
}

export async function getEmail(id: string): Promise<ActionResponse<EmailLogWithRelations>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_logs")
      .select(`
        *,
        sender:users!email_logs_sender_id_fkey(id, full_name, avatar_url),
        contacts!email_logs_contact_id_fkey(id, first_name, last_name, email),
        deals!email_logs_deal_id_fkey(id, title),
        companies!email_logs_company_id_fkey(id, company_name)
      `)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as EmailLogWithRelations };
  } catch {
    return { success: false, error: "Failed to fetch email" };
  }
}

// ──────────────────────────────────────────────────────────────
// Email Template CRUD
// ──────────────────────────────────────────────────────────────

export async function getEmailTemplates(): Promise<ActionResponse<Tables<"email_templates">[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_templates")
      .select("*")
      .eq("workspace_id", ctx.workspaceId)
      .order("name", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"email_templates">[] };
  } catch {
    return { success: false, error: "Failed to fetch templates" };
  }
}

export async function createEmailTemplate(input: unknown): Promise<ActionResponse<Tables<"email_templates">>> {
  try {
    const parsed = createEmailTemplateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("email_templates") as any)
      .insert({
        ...parsed.data,
        workspace_id: ctx.workspaceId,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create template" };
  }
}

export async function updateEmailTemplate(input: unknown): Promise<ActionResponse<Tables<"email_templates">>> {
  try {
    const parsed = updateEmailTemplateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("email_templates") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update template" };
  }
}

export async function deleteEmailTemplate(id: string): Promise<ActionResponse> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("email_templates").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete template" };
  }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Strip HTML tags for plain-text fallback */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
