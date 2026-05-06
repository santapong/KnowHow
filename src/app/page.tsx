import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingHero } from "@/components/LandingHero";
import { getOptionalUser } from "@/lib/auth/getUser";

export default async function Home() {
  const user = await getOptionalUser();
  if (user) redirect("/shelf");

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <LandingHero />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(20,17,13,0.65)_85%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-[#14110d]/55 to-[#14110d]"
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-7">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[color:var(--color-ink)]"
          aria-label="KnowHow home"
        >
          <span
            aria-hidden
            className="block h-7 w-5 rounded-[2px] border border-[color:var(--color-ink)]/60 bg-gradient-to-b from-[color:var(--color-gold)]/30 to-[color:var(--color-leather)]"
          />
          <span className="text-lg font-semibold tracking-tight">KnowHow</span>
        </Link>

        <Link
          href="/login"
          className="rounded-md border border-[color:var(--color-ink)]/25 bg-black/30 px-4 py-2 text-sm tracking-wide text-[color:var(--color-ink)]/90 backdrop-blur transition hover:border-[color:var(--color-ink)]/55 hover:bg-black/40"
        >
          Sign in
        </Link>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-12 px-6 pb-12 md:hidden">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
            est. 2026 · pdf reader
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight text-[color:var(--color-ink)]">
            Read it
            <br />
            like a book.
          </h1>
        </div>
        <div className="space-y-5">
          <p className="max-w-sm text-[15px] leading-relaxed text-[color:var(--color-ink)]/75">
            Drop a PDF. We&rsquo;ll set it on a shelf, give it a spine, and
            remember the page you stopped on.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-gold)] px-5 py-3 text-sm font-medium text-[color:var(--color-leather)] shadow-[0_8px_24px_rgba(201,164,91,0.25)] transition hover:opacity-90"
            >
              Begin →
            </Link>
            <Link
              href="/community"
              className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-ink)]/80"
            >
              Browse community shelves →
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="absolute bottom-16 left-10 z-10 max-w-[34rem] lg:bottom-20 lg:left-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
            est. 2026 · pdf reader
          </p>
          <h1 className="mt-4 font-serif text-7xl leading-[0.92] tracking-tight text-[color:var(--color-ink)] lg:text-[7.5rem]">
            Read it
            <br />
            like a book.
          </h1>
        </div>

        <div className="absolute right-10 bottom-20 z-10 w-72 text-right lg:right-16 lg:bottom-24 lg:w-80">
          <p className="text-[15px] leading-relaxed text-[color:var(--color-ink)]/75">
            Drop a PDF. We&rsquo;ll set it on a shelf, give it a spine, and
            remember the page you stopped on.
          </p>
          <div className="mt-5 flex flex-col items-end gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-gold)] px-6 py-3 text-sm font-medium text-[color:var(--color-leather)] shadow-[0_10px_30px_rgba(201,164,91,0.25)] transition hover:opacity-90"
            >
              Begin →
            </Link>
            <Link
              href="/community"
              className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-ink)]/80"
            >
              Browse community shelves →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
