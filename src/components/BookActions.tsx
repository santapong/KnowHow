"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBookPublic, deleteBook } from "@/actions/toggleBookPublic";

type Props = {
  bookId: string;
  isPublic: boolean;
};

export function BookActions({ bookId, isPublic }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticPublic, setOptimisticPublic] = useState(isPublic);
  const [error, setError] = useState<string | null>(null);

  function onTogglePublic() {
    const next = !optimisticPublic;
    setOptimisticPublic(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleBookPublic({ bookId, isPublic: next });
      if (!result.ok) {
        setOptimisticPublic(!next);
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!confirm("Delete this book? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBook({ bookId });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <label className="flex cursor-pointer items-center gap-2 text-[color:var(--color-ink)]/70">
        <input
          type="checkbox"
          checked={optimisticPublic}
          onChange={onTogglePublic}
          disabled={pending}
        />
        Public
      </label>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="text-[color:var(--color-ink)]/50 hover:text-red-400"
      >
        Delete
      </button>
      {error && <span className="text-red-400">{error}</span>}
    </div>
  );
}
