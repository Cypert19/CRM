import { z } from "zod";
import { tagsSchema } from "./common";

export const createNoteSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  content: z.any().default({}),
  plain_text: z.string().default(""),
  deal_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  is_pinned: z.boolean().default(false),
  tags: tagsSchema,
});

export const updateNoteSchema = createNoteSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
