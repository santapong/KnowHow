import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PdfReader2D } from "@/components/PdfReader2D";
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
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {book.title}
            </h1>
            {book.author && (
              <p className="text-sm text-[color:var(--color-ink)]/60">
                {book.author}
              </p>
            )}
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/40">
            <Link
              href={useFlat ? `/shelf/${book.id}` : `/shelf/${book.id}?flat=1`}
              className="hover:text-[color:var(--color-ink)]/80"
            >
              {useFlat ? "3D view" : "2D view"}
            </Link>
          </div>
        </div>

        {useFlat ? (
          <PdfReader2D
            bookId={book.id}
            pdfUrl={pdfUrl}
            pageCount={book.page_count}
            initialPage={initialPage}
            canPersist={!!viewer}
          />
        ) : (
          <BookReader3D
            bookId={book.id}
            pdfUrl={pdfUrl}
            pageCount={book.page_count}
            initialPage={initialPage}
            canPersist={!!viewer}
            spineColor={book.spine_color}
            title={book.title}
          />
        )}
      </main>
    </>
  );
}
