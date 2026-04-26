"use server";

import { createClient } from "@/lib/supabase/server";
import { updateReadingStateSchema } from "@/lib/validation";

export async function saveReadingState(input: {
  bookId: string;
  lastPage: number;
}) {
  const parsed = updateReadingStateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("reading_state")
    .upsert(
      {
        user_id: user.id,
        book_id: parsed.data.bookId,
        last_page: parsed.data.lastPage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" },
    );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
