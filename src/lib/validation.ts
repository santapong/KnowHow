import { z } from "zod";

export const SPINE_COLORS = [
  "#8B4513",
  "#3E2723",
  "#1B4332",
  "#1F3A5F",
  "#5C0F1A",
  "#4A3A2A",
] as const;

export const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(120).nullable(),
  pageCount: z.number().int().min(1).max(20000),
  spineColor: z.enum(SPINE_COLORS),
  sizeBytes: z.number().int().min(1).max(100 * 1024 * 1024),
  acceptDmca: z.literal(true),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

export const updateReadingStateSchema = z.object({
  bookId: z.string().uuid(),
  lastPage: z.number().int().min(0),
});
