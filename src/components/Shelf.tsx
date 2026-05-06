"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { BookWithCover } from "@/lib/books";
import { ShelfGridFallback } from "@/components/ShelfGridFallback";

const BookshelfScene = dynamic(() => import("@/scenes/BookshelfScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] min-h-[440px] items-center justify-center rounded-xl bg-gradient-to-b from-[#1d1812] to-[#0e0b08] text-sm text-[color:var(--color-ink)]/40">
      Building your shelf…
    </div>
  ),
});

type Props = {
  books: BookWithCover[];
  emptyHref?: string;
  forceFallback?: boolean;
  showOwner?: boolean;
};

export function Shelf({ books, emptyHref = "/upload", forceFallback, showOwner }: Props) {
  if (books.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[color:var(--color-ink)]/15 p-10 text-center">
        <p className="text-sm text-[color:var(--color-ink)]/70">
          No books on this shelf yet.
        </p>
        <Link
          href={emptyHref}
          className="rounded-md bg-[color:var(--color-gold)] px-4 py-2 text-sm font-medium text-[color:var(--color-leather)]"
        >
          Add a book
        </Link>
      </div>
    );
  }

  if (forceFallback) {
    return <ShelfGridFallback books={books} showOwner={showOwner} />;
  }

  return <BookshelfScene books={books} />;
}
