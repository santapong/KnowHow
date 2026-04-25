import Link from "next/link";
import type { BookWithCover } from "@/lib/books";
import { BookActions } from "@/components/BookActions";

export function BookManageList({ books }: { books: BookWithCover[] }) {
  if (books.length === 0) return null;

  return (
    <ul className="mt-8 divide-y divide-[color:var(--color-ink)]/10 rounded-lg border border-[color:var(--color-ink)]/10">
      {books.map((b) => (
        <li
          key={b.id}
          className="flex items-center gap-4 px-4 py-3 text-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.cover_url}
            alt=""
            className="h-12 w-8 flex-shrink-0 rounded-sm object-cover"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/shelf/${b.id}`}
              className="block truncate font-medium hover:text-[color:var(--color-gold)]"
            >
              {b.title}
            </Link>
            {b.author && (
              <p className="truncate text-xs text-[color:var(--color-ink)]/50">
                {b.author} · {b.page_count} pages
              </p>
            )}
          </div>
          <BookActions bookId={b.id} isPublic={b.is_public} />
        </li>
      ))}
    </ul>
  );
}
