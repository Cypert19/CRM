import { z } from "zod";
import { tagsSchema } from "./common";

export const createContactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  job_title: z.string().max(150).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  lifecycle_stage: z
    .enum(["Lead", "Marketing Qualified", "Sales Qualified", "Opportunity", "Customer", "Evangelist", "Other"])
    .nullable()
    .optional(),
  source: z
    .enum(["Inbound", "Outbound", "Referral", "Partner", "Event", "Website", "Other"])
    .nullable()
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .nullable()
    .optional(),
  social_profiles: z
    .object({
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
    })
    .optional()
    .default({}),
  tags: tagsSchema,
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
