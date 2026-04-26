"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
});

export async function updateDisplayName(input: { displayName: string }) {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const service = await createServiceClient();

  // Best-effort storage cleanup (RLS-bypassing service client).
  const { data: pdfFiles } = await service.storage
    .from("pdfs")
    .list(user.id, { limit: 1000 });
  if (pdfFiles?.length) {
    await service.storage
      .from("pdfs")
      .remove(pdfFiles.map((f) => `${user.id}/${f.name}`));
  }
  const { data: coverFiles } = await service.storage
    .from("covers")
    .list(user.id, { limit: 1000 });
  if (coverFiles?.length) {
    await service.storage
      .from("covers")
      .remove(coverFiles.map((f) => `${user.id}/${f.name}`));
  }

  // Delete the auth user. ON DELETE CASCADE drops profile/books/reading_state.
  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) return { ok: false as const, error: error.message };

  await supabase.auth.signOut();
  return { ok: true as const };
}
