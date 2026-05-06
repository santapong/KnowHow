"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { handleSchema } from "@/lib/validation";

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
  handle: handleSchema.optional(),
});

const AVATAR_BUCKET = "avatars";

export async function updateDisplayName(input: {
  displayName: string;
  handle?: string;
}) {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const update: { display_name: string; handle?: string } = {
    display_name: parsed.data.displayName,
  };
  if (parsed.data.handle) update.handle = parsed.data.handle.toLowerCase();

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "That handle is taken." };
    }
    return { ok: false as const, error: error.message };
  }
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function startAvatarUpload(input: { contentType: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  if (!input.contentType.startsWith("image/")) {
    return { ok: false as const, error: "Avatars must be images." };
  }
  const ext = input.contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") ?? "png";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const service = await createServiceClient();
  const { data, error } = await service.storage
    .from(AVATAR_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "Storage error" };
  }
  return {
    ok: true as const,
    path,
    uploadUrl: data.signedUrl,
    uploadToken: data.token,
  };
}

export async function finalizeAvatarUpload(input: { path: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  if (!input.path.startsWith(`${user.id}/`)) {
    return { ok: false as const, error: "Bad avatar path" };
  }

  const service = await createServiceClient();
  const { data: urlData } = service.storage.from(AVATAR_BUCKET).getPublicUrl(input.path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);
  if (error) return { ok: false as const, error: error.message };

  // Best-effort: prune older avatars.
  const { data: existing } = await service.storage
    .from(AVATAR_BUCKET)
    .list(user.id, { limit: 100 });
  const stale =
    existing
      ?.filter((f) => `${user.id}/${f.name}` !== input.path)
      .map((f) => `${user.id}/${f.name}`) ?? [];
  if (stale.length > 0) {
    await service.storage.from(AVATAR_BUCKET).remove(stale);
  }

  revalidatePath("/settings");
  return { ok: true as const, avatarUrl: urlData.publicUrl };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const service = await createServiceClient();

  // Best-effort storage cleanup (RLS-bypassing service client).
  for (const bucket of ["pdfs", "covers", AVATAR_BUCKET] as const) {
    const { data: files } = await service.storage
      .from(bucket)
      .list(user.id, { limit: 1000 });
    if (files?.length) {
      await service.storage
        .from(bucket)
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  // Delete the auth user. ON DELETE CASCADE drops profile/books/reading_state.
  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) return { ok: false as const, error: error.message };

  await supabase.auth.signOut();
  return { ok: true as const };
}
