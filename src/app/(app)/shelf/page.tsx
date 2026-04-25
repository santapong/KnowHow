import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Shelf } from "@/components/Shelf";
import { BookManageList } from "@/components/BookManageList";
import { listOwnBooks } from "@/lib/books";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "My shelf · KnowHow" };

type SearchParams = Promise<{ view?: string }>;

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUserOrRedirect("/shelf");
  const books = await listOwnBooks(user.id);
  const { view } = await searchParams;
  const forceGrid = view === "grid";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Your shelf</h1>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/40">
            <Link
              href={forceGrid ? "/shelf" : "/shelf?view=grid"}
              className="hover:text-[color:var(--color-ink)]/80"
            >
              {forceGrid ? "3D shelf" : "Grid view"}
            </Link>
            <Link
              href="/upload"
              className="rounded-md bg-[color:var(--color-gold)] px-3 py-1.5 tracking-normal text-[color:var(--color-leather)] hover:opacity-90"
            >
              + Upload
            </Link>
          </div>
        </div>

        <Shelf books={books} forceFallback={forceGrid} />

        {books.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-[color:var(--color-ink)]/50">
              Manage books
            </h2>
            <BookManageList books={books} />
          </section>
        )}
      </main>
    </>
  );
}
