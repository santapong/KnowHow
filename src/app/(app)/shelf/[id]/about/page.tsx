import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { getBook, getReadingState } from "@/lib/books";
import { getOptionalUser, getUserOrRedirect } from "@/lib/auth/getUser";
import { BOOK_GENRE_LABELS } from "@/lib/validation";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book ? `${book.title} · KnowHow` : "KnowHow" };
}

export default async function BookAboutPage({ params }: Props) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const viewer = await getOptionalUser();
  if (!book.is_public) {
    await getUserOrRedirect(`/shelf/${id}/about`);
    if (!viewer || viewer.id !== book.owner_id) notFound();
  }

  const lastPage = viewer ? await getReadingState(viewer.id, book.id) : 0;
  const progress =
    book.page_count > 0 ? Math.round((lastPage / book.page_count) * 100) : 0;
  const sizeMb = (book.size_bytes / (1024 * 1024)).toFixed(1);

  return (
    <>
      <Nav active={viewer?.id === book.owner_id ? "shelf" : "community"} />
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        <Link
          href={viewer?.id === book.owner_id ? "/shelf" : "/community"}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-ink)]"
        >
          ← {viewer?.id === book.owner_id ? "shelf" : "community"}
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-[200px_1fr]">
          <div className="mx-auto md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.cover_url}
              alt=""
              className="h-auto w-[200px] rounded-sm object-cover shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
            />
          </div>

          <div className="space-y-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
                {BOOK_GENRE_LABELS[book.genre] ?? "Other"}
                {book.is_public ? " · Public" : " · Private"}
              </p>
              <h1 className="mt-2 font-serif text-5xl font-semibold leading-[1] tracking-tight">
                {book.title}
              </h1>
              {book.author && (
                <p className="mt-2 text-lg text-[color:var(--color-ink)]/75">
                  {book.author}
                </p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail label="Pages" value={book.page_count.toLocaleString()} />
              <Detail label="Size" value={`${sizeMb} MB`} />
              <Detail
                label="Added"
                value={new Date(book.created_at).toLocaleDateString()}
              />
              {book.owner && (
                <Detail
                  label="Shelved by"
                  value={
                    book.owner.handle ? (
                      <Link
                        href={`/u/${book.owner.handle}`}
                        className="text-[color:var(--color-ink)] hover:text-[color:var(--color-gold)]"
                      >
                        {book.owner.display_name ?? book.owner.handle}
                      </Link>
                    ) : (
                      book.owner.display_name ?? "Anonymous"
                    )
                  }
                />
              )}
            </dl>

            {viewer && progress > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
                  Your progress
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--color-ink)]/10">
                    <div
                      className="h-full rounded-full bg-[color:var(--color-gold)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-[color:var(--color-ink)]/60">
                    p. {lastPage} / {book.page_count} · {progress}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4">
              <Link
                href={`/shelf/${book.id}`}
                className="rounded-md bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-leather)] shadow-[0_8px_24px_rgba(201,164,91,0.2)] transition hover:opacity-90"
              >
                {lastPage > 0 ? "Resume reading →" : "Open the book →"}
              </Link>
              <Link
                href={`/shelf/${book.id}?flat=1`}
                className="rounded-md border border-[color:var(--color-ink)]/25 px-5 py-2.5 text-sm text-[color:var(--color-ink)]/85 hover:border-[color:var(--color-ink)]/55"
              >
                Read in 2D
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <>
      <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/45">
        {label}
      </dt>
      <dd className="text-[color:var(--color-ink)]">{value}</dd>
    </>
  );
}
