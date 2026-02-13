import { z } from "zod";

export const createTranscriptSchema = z.object({
  deal_id: z.string().uuid(),
  title: z.string().min(1).max(500).default("Untitled Transcript"),
  transcript_text: z.string().min(10, "Transcript must be at least 10 characters"),
});

export const updateTranscriptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  ai_extracted_tasks: z.unknown().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
});

export const deleteTranscriptSchema = z.object({
  id: z.string().uuid(),
});

export type CreateTranscriptInput = z.infer<typeof createTranscriptSchema>;
export type UpdateTranscriptInput = z.infer<typeof updateTranscriptSchema>;
