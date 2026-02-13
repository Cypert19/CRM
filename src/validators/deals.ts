import { z } from "zod";
import { tagsSchema } from "./common";

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createDealSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  value: z.number().min(0).default(0),
  audit_fee: z.number().min(0).default(0),
  retainer_monthly: z.number().min(0).default(0),
  custom_dev_fee: z.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  stage_id: z.string().uuid("Invalid stage"),
  pipeline_id: z.string().uuid("Invalid pipeline"),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  expected_close_date: z.string().nullable().optional(),
  probability: z.number().int().min(0).max(100).nullable().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).nullable().optional(),
  source: z
    .enum(["Inbound", "Outbound", "Referral", "Partner", "Event", "Website", "Other", "LinkedIn", "Cold Outreach", "Conference"])
    .nullable()
    .optional(),
  tags: tagsSchema,
  description: z.string().max(10000).nullable().optional(),
  // Revenue date fields
  revenue_start_date: z.string().regex(dateStringRegex, "Must be YYYY-MM-DD").nullable().optional(),
  revenue_end_date: z.string().regex(dateStringRegex, "Must be YYYY-MM-DD").nullable().optional(),
  // PRD fields
  payment_type: z.enum(["one_time", "retainer"]).nullable().optional(),
  payment_frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"]).nullable().optional(),
  scope: z.string().max(10000).nullable().optional(),
  services_description: z.string().max(10000).nullable().optional(),
  adoption_capacity: z.string().max(1000).nullable().optional(),
  next_step: z.string().max(1000).nullable().optional(),
  competitor: z.string().max(500).nullable().optional(),
  deal_industry: z.enum(["technology", "healthcare", "finance", "manufacturing", "retail", "education", "consulting", "real_estate", "other"]).nullable().optional(),
  company_size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).nullable().optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid(),
  lost_reason: z.string().max(1000).nullable().optional(),
  win_reason: z.string().max(1000).nullable().optional(),
});

export const moveDealStageSchema = z.object({
  id: z.string().uuid(),
  stage_id: z.string().uuid(),
  lost_reason: z.string().max(1000).nullable().optional(),
});

// --- Revenue item schemas ---
export const upsertRevenueItemSchema = z.object({
  deal_id: z.string().uuid(),
  month: z.string().regex(dateStringRegex, "Must be YYYY-MM-DD (first of month)"),
  item_type: z.enum(["retainer", "audit_fee", "custom_dev_fee"]),
  amount: z.number().min(0, "Amount must be non-negative"),
  notes: z.string().max(1000).nullable().optional(),
});

export const deleteRevenueItemSchema = z.object({
  deal_id: z.string().uuid(),
  month: z.string().regex(dateStringRegex, "Must be YYYY-MM-DD (first of month)"),
  item_type: z.enum(["retainer", "audit_fee", "custom_dev_fee"]),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type MoveDealStageInput = z.infer<typeof moveDealStageSchema>;
export type UpsertRevenueItemInput = z.infer<typeof upsertRevenueItemSchema>;
export type DeleteRevenueItemInput = z.infer<typeof deleteRevenueItemSchema>;
