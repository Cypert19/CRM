import { z } from "zod";

export const uploadKBFileSchema = z.object({
  deal_id: z.string().uuid("Invalid deal ID"),
  category: z
    .string()
    .max(100, "Category must be 100 chars or less")
    .nullable()
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be 2000 chars or less")
    .nullable()
    .optional(),
});

export const updateFileMetadataSchema = z.object({
  id: z.string().uuid("Invalid file ID"),
  category: z.string().max(100).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
});

export type UploadKBFileInput = z.infer<typeof uploadKBFileSchema>;
export type UpdateFileMetadataInput = z.infer<typeof updateFileMetadataSchema>;
