import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Shelf } from "@/components/Shelf";
import { listBooksByOwnerHandle } from "@/lib/books";
import { supabaseConfigured } from "@/lib/env";

type Params = Promise<{ handle: string }>;
type SearchParams = Promise<{ view?: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
  const { handle } = await params;
  return { title: `${handle} · KnowHow` };
}

export default async function UserShelfPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { handle } = await params;
  const { view } = await searchParams;
  const forceGrid = view === "grid";

  if (!supabaseConfigured) notFound();
  const result = await listBooksByOwnerHandle(handle);
  if (!result) notFound();

  const { owner, books } = result;
  const totalPages = books.reduce((sum, b) => sum + (b.page_count ?? 0), 0);

  return (
    <>
      <Nav active="community" />
      <main className="px-6 pt-10 pb-12 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              aria-hidden
              className="grid h-20 w-20 place-items-center rounded-full border border-[color:var(--color-ink)]/25 bg-[color:var(--color-ink)]/5 font-serif text-2xl text-[color:var(--color-ink)]/70 overflow-hidden"
            >
              {owner.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={owner.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (owner.display_name ?? owner.handle ?? "?")[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
                @{owner.handle ?? handle}
              </p>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-[1] tracking-tight md:text-5xl">
                {owner.display_name ?? owner.handle ?? "Anonymous reader"}
              </h1>
              <p className="mt-2 text-sm text-[color:var(--color-ink)]/60">
                {books.length} public {books.length === 1 ? "book" : "books"}
                {totalPages > 0 && ` · ${totalPages.toLocaleString()} pages shelved`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={
                forceGrid
                  ? `/u/${owner.handle ?? handle}`
                  : `/u/${owner.handle ?? handle}?view=grid`
              }
              className="rounded-full border border-[color:var(--color-ink)]/20 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]/60 hover:border-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]/90"
            >
              {forceGrid ? "3D shelf" : "Grid view"}
            </Link>
            <Link
              href="/community"
              className="rounded-full border border-[color:var(--color-ink)]/20 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]/60 hover:border-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]/90"
            >
              ← all readers
            </Link>
          </div>
        </div>
      </main>

      <section className="border-t border-[color:var(--color-ink)]/10 bg-gradient-to-b from-[#1a140d] to-[#100c08]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
          <Shelf books={books} emptyHref="/community" forceFallback={forceGrid} />
        </div>
      </section>
    </>
  );
}
