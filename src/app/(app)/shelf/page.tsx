import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Shelf } from "@/components/Shelf";
import { BookManageList } from "@/components/BookManageList";
import { ShelfSearch } from "@/components/ShelfSearch";
import { listOwnBooks } from "@/lib/books";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "My shelf · KnowHow" };

type SearchParams = Promise<{ view?: string; q?: string }>;

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUserOrRedirect("/shelf");
  const { view, q } = await searchParams;
  const forceGrid = view === "grid";
  const query = q?.trim() || undefined;
  const books = await listOwnBooks(user.id, query);

  const totalBytes = books.reduce((sum, b) => sum + (b.size_bytes ?? 0), 0);
  const totalGb = totalBytes / (1024 * 1024 * 1024);
  const lastTitle = books[0]?.title ?? null;

  return (
    <>
      <Nav active="shelf" />
      <main className="px-6 pt-8 pb-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
                {books.length} {books.length === 1 ? "book" : "books"}
                {totalBytes > 0 && ` · ${totalGb.toFixed(2)} GB`}
                {lastTitle && ` · last opened: ${lastTitle}`}
              </p>
              <h1 className="mt-3 font-serif text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
                My shelf.
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ShelfSearch initialQuery={query ?? ""} forceGrid={forceGrid} />
              <Link
                href={
                  forceGrid
                    ? query
                      ? `/shelf?q=${encodeURIComponent(query)}`
                      : "/shelf"
                    : query
                      ? `/shelf?view=grid&q=${encodeURIComponent(query)}`
                      : "/shelf?view=grid"
                }
                className="rounded-full border border-[color:var(--color-ink)]/20 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]/60 hover:border-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]/90"
              >
                {forceGrid ? "3D shelf" : "Grid view"}
              </Link>
              <Link
                href="/upload"
                className="rounded-md bg-[color:var(--color-gold)] px-4 py-2 text-sm font-medium text-[color:var(--color-leather)] shadow-[0_8px_24px_rgba(201,164,91,0.2)] transition hover:opacity-90"
              >
                + Upload
              </Link>
            </div>
          </div>
        </div>
      </main>

      <section className="border-t border-[color:var(--color-ink)]/10 bg-gradient-to-b from-[#1a140d] to-[#100c08]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
          <Shelf books={books} forceFallback={forceGrid} />
        </div>
      </section>

      {books.length > 0 && (
        <section className="px-6 py-12 md:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
              Manage books
            </h2>
            <BookManageList books={books} />
          </div>
        </section>
      )}
    </>
  );
}
