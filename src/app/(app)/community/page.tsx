import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Shelf } from "@/components/Shelf";
import { listPublicBooks } from "@/lib/books";
import { supabaseConfigured } from "@/lib/env";

export const metadata = { title: "Community · KnowHow" };

type SearchParams = Promise<{ view?: string }>;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const books = supabaseConfigured ? await listPublicBooks() : [];
  const { view } = await searchParams;
  const forceGrid = view === "grid";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
            <p className="mt-1 text-sm text-[color:var(--color-ink)]/60">
              Public bookshelves from around KnowHow.
            </p>
          </div>
          <Link
            href={forceGrid ? "/community" : "/community?view=grid"}
            className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]/80"
          >
            {forceGrid ? "3D shelf" : "Grid view"}
          </Link>
        </div>

        <Shelf books={books} emptyHref="/" forceFallback={forceGrid} />
      </main>
    </>
  );
}
