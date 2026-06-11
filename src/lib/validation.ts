import { z } from "zod";

export const SPINE_COLORS = [
  "#8B4513",
  "#3E2723",
  "#1B4332",
  "#1F3A5F",
  "#5C0F1A",
  "#4A3A2A",
] as const;

export const BOOK_GENRES = [
  "fiction",
  "poetry",
  "essays",
  "history",
  "philosophy",
  "other",
] as const;
export type BookGenre = (typeof BOOK_GENRES)[number];

export const BOOK_GENRE_LABELS: Record<BookGenre, string> = {
  fiction: "Fiction",
  poetry: "Poetry",
  essays: "Essays",
  history: "History",
  philosophy: "Philosophy",
  other: "Other",
};

export const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(120).nullable(),
  pageCount: z.number().int().min(1).max(20000),
  spineColor: z.enum(SPINE_COLORS),
  genre: z.enum(BOOK_GENRES).default("other"),
  sizeBytes: z.number().int().min(1).max(100 * 1024 * 1024),
  acceptDmca: z.literal(true),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

export const updateReadingStateSchema = z.object({
  bookId: z.string().uuid(),
  lastPage: z.number().int().min(0),
});

export const handleSchema = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/i, "Handles can only contain letters, numbers, and dashes.");

// --- Course layer (LMS) ---------------------------------------

export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Slugs can only contain lowercase letters, numbers, and dashes.");

export const enrollSchema = z.object({
  courseId: z.string().uuid(),
});

export const lessonProgressSchema = z.object({
  lessonId: z.string().uuid(),
  completed: z.boolean(),
});

/** Build a URL-safe slug from a free-text title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
