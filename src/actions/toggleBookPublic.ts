"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  bookId: z.string().uuid(),
  isPublic: z.boolean(),
});

export async function toggleBookPublic(input: {
  bookId: string;
  isPublic: boolean;
}) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("books")
    .update({ is_public: parsed.data.isPublic, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.bookId)
    .eq("owner_id", user.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/shelf");
  revalidatePath("/community");
  return { ok: true as const };
}

const deleteSchema = z.object({ bookId: z.string().uuid() });

export async function deleteBook(input: { bookId: string }) {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: book, error: readError } = await supabase
    .from("books")
    .select("pdf_path, cover_path")
    .eq("id", parsed.data.bookId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (readError || !book) return { ok: false as const, error: "Not found" };

  await supabase.storage.from("pdfs").remove([book.pdf_path]);
  await supabase.storage.from("covers").remove([book.cover_path]);

  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", parsed.data.bookId)
    .eq("owner_id", user.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/shelf");
  revalidatePath("/community");
  return { ok: true as const };
}
