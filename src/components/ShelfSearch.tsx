"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = {
  initialQuery: string;
  forceGrid?: boolean;
};

export function ShelfSearch({ initialQuery, forceGrid }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (forceGrid) params.set("view", "grid");
    const s = params.toString();
    router.push(s ? `/shelf?${s}` : "/shelf");
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search title or author"
        aria-label="Search your shelf"
        className="w-44 rounded-full border border-[color:var(--color-ink)]/20 bg-transparent px-3 py-1.5 text-xs text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/40 focus:border-[color:var(--color-gold)] focus:outline-none"
      />
    </form>
  );
}
