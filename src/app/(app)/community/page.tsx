import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Shelf } from "@/components/Shelf";
import { listPublicBooks } from "@/lib/books";
import { supabaseConfigured } from "@/lib/env";

export const metadata = { title: "Community · KnowHow" };

type SearchParams = Promise<{ view?: string }>;

const FILTERS = ["All", "Fiction", "Poetry", "Essays", "History", "Philosophy"];

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const books = supabaseConfigured ? await listPublicBooks() : [];
  const { view } = await searchParams;
  const forceGrid = view === "grid";

  const ownerCount = new Set(books.map((b) => b.owner_id)).size;

  return (
    <>
      <Nav active="community" />
      <main className="px-6 pt-10 pb-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
            {books.length.toLocaleString()} public books · {ownerCount} readers
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
            The shared library.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink)]/65">
            Bookshelves other readers chose to share. Hover any spine to see
            who shelved it; click to flip through the pages.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <span
                key={f}
                className={`rounded-full border px-3 py-1.5 text-xs tracking-wide ${
                  f === "All"
                    ? "border-[color:var(--color-gold)]/60 bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)]"
                    : "border-[color:var(--color-ink)]/20 text-[color:var(--color-ink)]/60"
                }`}
              >
                {f}
              </span>
            ))}
            <span className="ml-auto" />
            <Link
              href={forceGrid ? "/community" : "/community?view=grid"}
              className="rounded-full border border-[color:var(--color-ink)]/20 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]/60 hover:border-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]/90"
            >
              {forceGrid ? "3D shelf" : "Grid view"}
            </Link>
          </div>
        </div>
      </main>

      <section className="border-t border-[color:var(--color-ink)]/10 bg-gradient-to-b from-[#1a140d] to-[#100c08]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
          <Shelf books={books} emptyHref="/" forceFallback={forceGrid} />
        </div>
      </section>
    </>
  );
}
