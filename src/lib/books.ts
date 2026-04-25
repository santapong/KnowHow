import { createClient } from "@/lib/supabase/server";

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
  created_at: string;
  updated_at: string;
};

export type BookWithCover = BookRow & {
  cover_url: string;
};

const COVER_BUCKET = "covers";
const PDF_BUCKET = "pdfs";

export async function listOwnBooks(userId: string): Promise<BookWithCover[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((b) => withCoverUrl(supabase, b));
}

export async function listPublicBooks(): Promise<BookWithCover[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error || !data) return [];
  return data.map((b) => withCoverUrl(supabase, b));
}

export async function getBook(id: string): Promise<BookWithCover | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
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

function withCoverUrl(supabase: AnySupabase, b: BookRow): BookWithCover {
  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(b.cover_path);
  return { ...b, cover_url: data.publicUrl };
}
