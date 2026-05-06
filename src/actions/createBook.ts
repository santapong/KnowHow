"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createBookSchema, type CreateBookInput } from "@/lib/validation";
import { getStorageUsage } from "@/lib/billing";
import { formatGb } from "@/lib/billing";

const PDF_BUCKET = "pdfs";
const COVER_BUCKET = "covers";

export type CreateBookResult =
  | {
      ok: true;
      bookId: string;
      pdfUploadUrl: string;
      pdfUploadToken: string;
      pdfPath: string;
      coverUploadUrl: string;
      coverUploadToken: string;
      coverPath: string;
    }
  | { ok: false; error: string };

export async function startBookUpload(
  input: CreateBookInput,
): Promise<CreateBookResult> {
  const parsed = createBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Storage-cap enforcement. The upload itself goes direct to Supabase via
  // a signed URL, so we gate the signed-URL grant rather than the PUT.
  const usage = await getStorageUsage(user.id);
  if (usage.bytes + parsed.data.sizeBytes > usage.quotaBytes) {
    return {
      ok: false,
      error:
        `This upload would put you at ${formatGb(usage.bytes + parsed.data.sizeBytes)} ` +
        `which is over your ${formatGb(usage.quotaBytes)} cap. ` +
        `Upgrade at /pricing or remove a book first.`,
    };
  }

  const bookId = crypto.randomUUID();
  const pdfPath = `${user.id}/${bookId}.pdf`;
  const coverPath = `${user.id}/${bookId}.webp`;

  const service = await createServiceClient();
  const [pdfSigned, coverSigned] = await Promise.all([
    service.storage.from(PDF_BUCKET).createSignedUploadUrl(pdfPath),
    service.storage.from(COVER_BUCKET).createSignedUploadUrl(coverPath),
  ]);

  if (pdfSigned.error || !pdfSigned.data) {
    return { ok: false, error: pdfSigned.error?.message ?? "Storage error" };
  }
  if (coverSigned.error || !coverSigned.data) {
    return { ok: false, error: coverSigned.error?.message ?? "Storage error" };
  }

  return {
    ok: true,
    bookId,
    pdfUploadUrl: pdfSigned.data.signedUrl,
    pdfUploadToken: pdfSigned.data.token,
    pdfPath,
    coverUploadUrl: coverSigned.data.signedUrl,
    coverUploadToken: coverSigned.data.token,
    coverPath,
  };
}

export type FinalizeBookInput = CreateBookInput & {
  bookId: string;
  pdfPath: string;
  coverPath: string;
};

export async function finalizeBookUpload(
  input: FinalizeBookInput,
): Promise<{ ok: true; bookId: string } | { ok: false; error: string }> {
  const parsed = createBookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  if (!input.pdfPath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "Bad pdf path" };
  }
  if (!input.coverPath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "Bad cover path" };
  }

  const { error: insertError } = await supabase.from("books").insert({
    id: input.bookId,
    owner_id: user.id,
    title: input.title,
    author: input.author,
    page_count: input.pageCount,
    spine_color: input.spineColor,
    genre: input.genre,
    cover_path: input.coverPath,
    pdf_path: input.pdfPath,
    size_bytes: input.sizeBytes,
  });

  if (insertError) {
    const service = await createServiceClient();
    await service.storage.from(PDF_BUCKET).remove([input.pdfPath]);
    await service.storage.from(COVER_BUCKET).remove([input.coverPath]);
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/shelf");
  return { ok: true, bookId: input.bookId };
}
