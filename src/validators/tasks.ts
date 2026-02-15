import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  status: z.enum(["To Do", "In Progress", "Done", "Cancelled"]).default("To Do"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  due_date: z.string().nullable().optional(),
  due_time: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  task_type: z
    .enum(["Call", "Email", "Meeting", "Follow-Up", "Demo", "Proposal", "Automations", "Website Development", "Custom Development", "Training", "Consulting", "Other"])
    .default("Other"),
  reminder_at: z.string().nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
  // PRD fields
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  estimated_minutes: z.number().int().min(0).nullable().optional(),
  actual_minutes: z.number().int().min(0).nullable().optional(),
  category: z.enum(["deal", "personal", "workshop", "other"]).nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
  completed_at: z.string().nullable().optional(),
  focus_started_at: z.string().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
