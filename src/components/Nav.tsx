import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";

type NavProps = {
  /** Active route key — adds an accent underline to the matching link. */
  active?: "shelf" | "upload" | "community" | "settings";
};

export async function Nav({ active }: NavProps = {}) {
  const user = await getOptionalUser();
  let avatarUrl: string | null = null;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    avatarUrl = data?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-ink)]/10 bg-[#14110d]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[color:var(--color-ink)]"
          aria-label="KnowHow home"
        >
          <span
            aria-hidden
            className="block h-6 w-4 rounded-[2px] border border-[color:var(--color-ink)]/55 bg-gradient-to-b from-[color:var(--color-gold)]/30 to-[color:var(--color-leather)]"
          />
          <span className="font-serif text-lg font-semibold tracking-tight">
            KnowHow
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 text-sm">
          {user ? (
            <>
              <NavLink href="/shelf" active={active === "shelf"}>
                Shelf
              </NavLink>
              <NavLink href="/upload" active={active === "upload"}>
                Upload
              </NavLink>
              <NavLink href="/community" active={active === "community"}>
                Community
              </NavLink>
              <NavLink href="/settings" active={active === "settings"}>
                Settings
              </NavLink>

              <Link
                href="/settings"
                className="ml-3 grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-[color:var(--color-ink)]/30 text-xs uppercase tracking-wider text-[color:var(--color-ink)]/70 hover:border-[color:var(--color-gold)]/60"
                aria-label={user.email ?? "Account"}
                title={user.email ?? undefined}
              >
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user.email?.[0]?.toUpperCase() ?? "•")
                )}
              </Link>

              <form action="/auth/sign-out" method="post" className="ml-1">
                <button
                  type="submit"
                  className="rounded-md px-2 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45 hover:text-[color:var(--color-ink)]/80"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/community" active={active === "community"}>
                Community
              </NavLink>
              <Link
                href="/login"
                className="ml-2 rounded-md bg-[color:var(--color-gold)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-leather)] hover:opacity-90"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-1.5 text-sm transition ${
        active
          ? "text-[color:var(--color-ink)]"
          : "text-[color:var(--color-ink)]/60 hover:text-[color:var(--color-ink)]/90"
      }`}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-[color:var(--color-gold)]"
        />
      )}
    </Link>
  );
}
