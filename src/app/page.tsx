import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingHero } from "@/components/LandingHero";
import { Nav } from "@/components/Nav";
import { getOptionalUser } from "@/lib/auth/getUser";

export default async function Home() {
  const user = await getOptionalUser();
  if (user) redirect("/shelf");

  return (
    <>
      <Nav />
      <main className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden">
        <LandingHero />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#14110d]/40 to-[#14110d]" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center">
          <span className="mb-6 inline-block rounded-full border border-[color:var(--color-gold)]/30 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-gold)] backdrop-blur">
            v1
          </span>

          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            Your novels, on a shelf.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-ink)]/80">
            Drop your PDFs. KnowHow lays them out as books on a 3D shelf, and
            opens each one with realistic page flips. No AI. Just your library.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="pointer-events-auto rounded-md bg-[color:var(--color-gold)] px-5 py-3 text-sm font-medium text-[color:var(--color-leather)] transition hover:opacity-90"
            >
              Sign up free
            </Link>
            <Link
              href="/community"
              className="pointer-events-auto rounded-md border border-[color:var(--color-ink)]/30 bg-black/40 px-5 py-3 text-sm font-medium text-[color:var(--color-ink)]/90 backdrop-blur transition hover:border-[color:var(--color-ink)]/60"
            >
              Browse community shelves
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
