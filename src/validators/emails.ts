import { z } from "zod";

export const sendEmailSchema = z.object({
  to_emails: z.array(z.string().email("Invalid recipient email")).min(1, "At least one recipient required"),
  cc_emails: z.array(z.string().email()).default([]),
  bcc_emails: z.array(z.string().email()).default([]),
  subject: z.string().min(1, "Subject is required").max(998),
  body_html: z.string().min(1, "Email body is required"),
  body_text: z.string().default(""),
  contact_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  template_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  subject: z.string().min(1, "Subject is required").max(998),
  body_html: z.string().min(1, "Template body is required"),
  body_text: z.string().default(""),
  category: z.enum(["general", "follow_up", "introduction", "proposal", "closing", "other"]).default("general"),
  variables: z.array(z.string()).default([]),
});

export const updateEmailTemplateSchema = createEmailTemplateSchema.partial().extend({
  id: z.string().uuid(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
