import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/getUser";

export async function Nav() {
  const user = await getOptionalUser();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-ink)]/10 bg-[#14110d]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[color:var(--color-ink)]"
        >
          KnowHow
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/community"
            className="text-[color:var(--color-ink)]/70 hover:text-[color:var(--color-ink)]"
          >
            Community
          </Link>

          {user ? (
            <>
              <Link
                href="/shelf"
                className="text-[color:var(--color-ink)]/70 hover:text-[color:var(--color-ink)]"
              >
                Shelf
              </Link>
              <Link
                href="/upload"
                className="rounded-md border border-[color:var(--color-gold)]/40 px-3 py-1.5 text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)]/10"
              >
                Upload
              </Link>
              <Link
                href="/settings"
                className="text-[color:var(--color-ink)]/70 hover:text-[color:var(--color-ink)]"
                aria-label="Settings"
              >
                {user.email?.[0]?.toUpperCase() ?? "•"}
              </Link>
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="text-[color:var(--color-ink)]/50 hover:text-[color:var(--color-ink)]/80"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-[color:var(--color-gold)] px-3 py-1.5 text-[color:var(--color-leather)] hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
