import { z } from "zod";
import { tagsSchema } from "./common";

export const createCompanySchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(255),
  domain: z.string().max(255).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
  employee_count_range: z.string().max(50).nullable().optional(),
  annual_revenue_range: z.string().max(50).nullable().optional(),
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
  phone: z.string().max(30).nullable().optional(),
  website: z.string().url().nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  tags: tagsSchema,
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
