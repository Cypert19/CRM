import { z } from "zod";

export const createDealEventSchema = z.object({
  deal_id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).nullable().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().nullable().optional(),
  event_type: z
    .enum(["meeting", "call", "demo", "follow_up", "deadline", "other"])
    .default("meeting"),
  location: z.string().max(500).nullable().optional(),
  attendees: z
    .array(
      z.object({
        name: z.string(),
        email: z.string().email().optional(),
      })
    )
    .default([]),
});

export const updateDealEventSchema = createDealEventSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateDealEventInput = z.infer<typeof createDealEventSchema>;
export type UpdateDealEventInput = z.infer<typeof updateDealEventSchema>;
