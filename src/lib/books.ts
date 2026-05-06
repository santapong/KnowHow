import { createClient } from "@/lib/supabase/server";
import type { BookGenre } from "@/lib/validation";

export type BookRow = {
  id: string;
  owner_id: string;
  title: string;
  author: string | null;
  page_count: number;
  spine_color: string;
  cover_path: string;
  pdf_path: string;
  size_bytes: number;
  is_public: boolean;
  genre: BookGenre;
  created_at: string;
  updated_at: string;
};

export type BookWithCover = BookRow & {
  cover_url: string;
  owner?: ProfileSummary | null;
};

export type ProfileSummary = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

const COVER_BUCKET = "covers";
const PDF_BUCKET = "pdfs";

export async function listOwnBooks(
  userId: string,
  query?: string,
): Promise<BookWithCover[]> {
  const supabase = await createClient();
  let q = supabase
    .from("books")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (query && query.trim()) {
    const t = `%${query.trim()}%`;
    q = q.or(`title.ilike.${t},author.ilike.${t}`);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((b) => withCoverUrl(supabase, b));
}

type ListPublicOpts = {
  genre?: BookGenre;
  query?: string;
  limit?: number;
};

export async function listPublicBooks(
  opts: ListPublicOpts = {},
): Promise<BookWithCover[]> {
  const supabase = await createClient();
  let q = supabase
    .from("books")
    .select("*, owner:profiles!books_owner_id_fkey(id, handle, display_name, avatar_url)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 60);
  if (opts.genre) q = q.eq("genre", opts.genre);
  if (opts.query && opts.query.trim()) {
    const t = `%${opts.query.trim()}%`;
    q = q.or(`title.ilike.${t},author.ilike.${t}`);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((b) => withCoverUrl(supabase, b));
}

export async function listBooksByOwnerHandle(
  handle: string,
): Promise<{ owner: ProfileSummary; books: BookWithCover[] } | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .ilike("handle", handle)
    .maybeSingle();
  if (!profile) return null;
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("owner_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  return {
    owner: profile,
    books: (books ?? []).map((b) => withCoverUrl(supabase, b)),
  };
}

export async function getBook(id: string): Promise<BookWithCover | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*, owner:profiles!books_owner_id_fkey(id, handle, display_name, avatar_url)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return withCoverUrl(supabase, data);
}

export async function getSignedPdfUrl(pdfPath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(pdfPath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getReadingState(
  userId: string,
  bookId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reading_state")
    .select("last_page")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  return data?.last_page ?? 0;
}

type AnySupabase = Awaited<ReturnType<typeof createClient>>;

function withCoverUrl(
  supabase: AnySupabase,
  b: BookRow & { owner?: ProfileSummary | null },
): BookWithCover {
  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(b.cover_path);
  return { ...b, cover_url: data.publicUrl };
}
