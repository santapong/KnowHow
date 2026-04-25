import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <span className="mb-6 rounded-full border border-[color:var(--color-gold)]/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-gold)]">
          v1 · in development
        </span>

        <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
          KnowHow
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-ink)]/80">
          Upload your novels. See them as books on a 3D bookshelf. Open one,
          and read it with real page flips. No AI. Just your library, the way
          it should look.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-[color:var(--color-gold)] px-5 py-3 text-sm font-medium text-[color:var(--color-leather)] transition hover:opacity-90"
          >
            Coming soon — sign up
          </Link>
          <a
            href="https://github.com/santapong/knowhow"
            className="rounded-md border border-[color:var(--color-ink)]/20 px-5 py-3 text-sm font-medium text-[color:var(--color-ink)]/90 transition hover:border-[color:var(--color-ink)]/40"
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
        </div>

        <ul className="mt-16 grid w-full grid-cols-1 gap-4 text-left text-sm text-[color:var(--color-ink)]/70 sm:grid-cols-3">
          <li className="rounded-lg border border-[color:var(--color-ink)]/10 p-4">
            <span className="block text-[color:var(--color-gold)]">01</span>
            <span className="mt-2 block">
              Drag a PDF in. Title and cover are extracted in your browser.
            </span>
          </li>
          <li className="rounded-lg border border-[color:var(--color-ink)]/10 p-4">
            <span className="block text-[color:var(--color-gold)]">02</span>
            <span className="mt-2 block">
              Your 3D shelf shows every book you own, in your chosen colour.
            </span>
          </li>
          <li className="rounded-lg border border-[color:var(--color-ink)]/10 p-4">
            <span className="block text-[color:var(--color-gold)]">03</span>
            <span className="mt-2 block">
              Click a spine. The book opens. Flip pages with a drag.
            </span>
          </li>
        </ul>

        <p className="mt-16 text-xs uppercase tracking-[0.25em] text-[color:var(--color-ink)]/40">
          Phase 0 · Vercel deploy check
        </p>
      </div>
    </main>
  );
}
