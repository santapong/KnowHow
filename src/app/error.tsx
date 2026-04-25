"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something broke</h1>
      <p className="max-w-md text-sm text-[color:var(--color-ink)]/60">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-md bg-[color:var(--color-gold)] px-4 py-2 text-sm font-medium text-[color:var(--color-leather)]"
      >
        Try again
      </button>
    </main>
  );
}
