"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { BookGenre } from "@/lib/validation";

type Props = {
  initialQuery: string;
  activeGenre?: BookGenre;
  forceGrid?: boolean;
};

export function CommunitySearch({ initialQuery, activeGenre, forceGrid }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (activeGenre) params.set("genre", activeGenre);
    if (value.trim()) params.set("q", value.trim());
    if (forceGrid) params.set("view", "grid");
    const s = params.toString();
    router.push(s ? `/community?${s}` : "/community");
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search title or author"
        aria-label="Search community books"
        className="w-44 rounded-full border border-[color:var(--color-ink)]/20 bg-transparent px-3 py-1.5 text-xs text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/40 focus:border-[color:var(--color-gold)] focus:outline-none"
      />
    </form>
  );
}
