"use client";

import Link from "next/link";
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

  const isSupabaseSetup = /SUPABASE_/i.test(error.message);
  const isStorage = /storage|signed.?url/i.test(error.message);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
        unexpected error
      </p>
      <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
        {isSupabaseSetup
          ? "KnowHow isn't configured."
          : isStorage
            ? "Couldn't reach storage."
            : "Something broke."}
      </h1>

      <p className="max-w-md text-sm text-[color:var(--color-ink)]/65">
        {isSupabaseSetup
          ? "Set the Supabase environment variables described in README.md and restart the server."
          : isStorage
            ? "The PDF or cover couldn't be loaded. The signed URL may have expired — try reloading."
            : error.message || "An unexpected error occurred."}
      </p>

      {error.digest && (
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/35">
          ref · {error.digest}
        </p>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-leather)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-[color:var(--color-ink)]/25 px-5 py-2.5 text-sm text-[color:var(--color-ink)]/85 hover:border-[color:var(--color-ink)]/55"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
