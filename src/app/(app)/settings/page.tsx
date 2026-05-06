import { Nav } from "@/components/Nav";
import { SettingsForm } from "@/components/SettingsForm";
import { createClient } from "@/lib/supabase/server";
import { getUserOrRedirect } from "@/lib/auth/getUser";
import { listOwnBooks } from "@/lib/books";

export const metadata = { title: "Settings · KnowHow" };
export const dynamic = "force-dynamic";

type Section = { id: string; label: string; danger?: boolean };

const SECTIONS: Section[] = [
  { id: "profile", label: "Profile" },
  { id: "storage", label: "Storage" },
  { id: "privacy", label: "Privacy" },
  { id: "danger", label: "Danger zone", danger: true },
];

export default async function SettingsPage() {
  const user = await getUserOrRedirect("/settings");
  const supabase = await createClient();
  const [{ data: profile }, books] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, handle, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    listOwnBooks(user.id),
  ]);

  const totalBytes = books.reduce((sum, b) => sum + (b.size_bytes ?? 0), 0);
  const totalGb = totalBytes / (1024 * 1024 * 1024);
  const publicCount = books.filter((b) => b.is_public).length;

  return (
    <>
      <Nav active="settings" />
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl">
        <aside className="hidden w-56 shrink-0 border-r border-[color:var(--color-ink)]/10 px-6 py-10 md:block">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/50">
            Settings
          </p>
          <nav className="space-y-1.5">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`block rounded-md border px-3 py-2 text-sm transition ${
                  s.id === "profile"
                    ? "border-[color:var(--color-ink)]/25 bg-[color:var(--color-ink)]/5 text-[color:var(--color-ink)]"
                    : "border-transparent text-[color:var(--color-ink)]/55 hover:bg-[color:var(--color-ink)]/5 hover:text-[color:var(--color-ink)]/85"
                } ${s.danger ? "text-red-400/85 hover:text-red-300" : ""}`}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex-1 px-6 py-10 md:px-12 md:py-14">
          <section id="profile" className="max-w-2xl">
            <h1 className="font-serif text-4xl font-semibold tracking-tight">
              Profile
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-ink)]/60">
              {user.email}
            </p>

            <div className="mt-10">
              <SettingsForm
                initialDisplayName={profile?.display_name ?? ""}
                initialHandle={profile?.handle ?? ""}
                initialAvatarUrl={profile?.avatar_url ?? null}
                email={user.email ?? null}
              />
            </div>
          </section>

          <section id="storage" className="mt-14 max-w-2xl border-t border-[color:var(--color-ink)]/10 pt-10">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              Storage
            </h2>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/55">
              {totalGb.toFixed(2)} GB · {books.length} books · {publicCount} public
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-ink)]/10">
              <div
                className="h-full rounded-full bg-[color:var(--color-gold)] transition-all"
                style={{ width: `${Math.min(100, (totalGb / 1) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[color:var(--color-ink)]/50">
              Free tier · 1.0 GB. Larger libraries can migrate to R2 (v2).
            </p>
          </section>

          <section
            id="privacy"
            className="mt-14 max-w-2xl border-t border-[color:var(--color-ink)]/10 pt-10"
          >
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              Privacy
            </h2>
            <p className="mt-3 text-sm text-[color:var(--color-ink)]/65">
              Books are private by default. Public sharing is opt-in per book —
              flip the toggle on any book card on your shelf.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
