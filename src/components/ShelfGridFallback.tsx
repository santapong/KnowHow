"use client";

import Link from "next/link";
import type { BookWithCover } from "@/lib/books";

export function ShelfGridFallback({ books }: { books: BookWithCover[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {books.map((b) => (
        <li key={b.id}>
          <Link
            href={`/shelf/${b.id}`}
            className="group block overflow-hidden rounded-md bg-[color:var(--color-ink)]/5 transition hover:bg-[color:var(--color-ink)]/10"
          >
            <div className="relative aspect-[2/3] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.cover_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-2">
              <p className="truncate text-sm font-medium">{b.title}</p>
              {b.author && (
                <p className="truncate text-xs text-[color:var(--color-ink)]/50">
                  {b.author}
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
