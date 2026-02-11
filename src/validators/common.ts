import { z } from "zod";

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const sortSchema = z.object({
  column: z.string(),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const uuidSchema = z.string().uuid();

export const tagsSchema = z.array(z.string().max(50)).max(20).default([]);
