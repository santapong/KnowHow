import { notFound } from "next/navigation";
import Link from "next/link";
import { PdfReader2D } from "@/components/PdfReader2D";
import { ReaderChrome } from "@/components/ReaderChrome";
import { BookReader3D } from "@/scenes/BookReader3D";
import { getBook, getReadingState, getSignedPdfUrl } from "@/lib/books";
import { getOptionalUser, getUserOrRedirect } from "@/lib/auth/getUser";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flat?: string }>;
};

export default async function ReaderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { flat } = await searchParams;

  const book = await getBook(id);
  if (!book) notFound();

  const viewer = await getOptionalUser();
  if (!book.is_public) {
    await getUserOrRedirect(`/shelf/${id}`);
    if (!viewer || viewer.id !== book.owner_id) notFound();
  }

  const pdfUrl = await getSignedPdfUrl(book.pdf_path);
  if (!pdfUrl) notFound();

  const initialPage = viewer
    ? await getReadingState(viewer.id, book.id)
    : 0;

  const useFlat = flat === "1";

  return (
    <main className="relative isolate min-h-screen bg-gradient-to-b from-[#100c08] via-[#0c0907] to-[#080605]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.55)_85%)]"
      />

      <ReaderChrome>
        <div className="flex items-start justify-between px-5 py-5 md:px-8">
        <div className="pointer-events-auto flex items-center gap-4">
          <Link
            href="/shelf"
            className="rounded-full border border-[color:var(--color-ink)]/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/70 backdrop-blur transition hover:border-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]"
          >
            ← shelf
          </Link>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55 md:inline">
            {book.title}
            {book.author ? ` · ${book.author}` : ""}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <span className="rounded-full border border-[color:var(--color-ink)]/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/55 backdrop-blur">
            Aa
          </span>
          <Link
            href={useFlat ? `/shelf/${book.id}` : `/shelf/${book.id}?flat=1`}
            className="rounded-full bg-[color:var(--color-gold)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[color:var(--color-leather)] backdrop-blur transition hover:opacity-90"
          >
            {useFlat ? "3D view" : "2D view"}
          </Link>
        </div>
        </div>
      </ReaderChrome>

      {useFlat ? (
        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-20 pb-12 md:pt-24">
          <PdfReader2D
            bookId={book.id}
            pdfUrl={pdfUrl}
            pageCount={book.page_count}
            initialPage={initialPage}
            canPersist={!!viewer}
          />
        </div>
      ) : (
        <div className="relative z-10">
          <BookReader3D
            bookId={book.id}
            pdfUrl={pdfUrl}
            pageCount={book.page_count}
            initialPage={initialPage}
            canPersist={!!viewer}
            spineColor={book.spine_color}
            title={book.title}
          />
        </div>
      )}
    </main>
  );
}
