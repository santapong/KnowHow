import { Nav } from "@/components/Nav";
import { SettingsForm } from "@/components/SettingsForm";
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { createClient } from "@/lib/supabase/server";
import { getUserOrRedirect } from "@/lib/auth/getUser";
import { getStorageUsage, getSubscription, formatGb } from "@/lib/billing";
import { planForTier } from "@/lib/stripe";
import { stripeConfigured } from "@/lib/env";

export const metadata = { title: "Settings · KnowHow" };
export const dynamic = "force-dynamic";

type Section = { id: string; label: string; danger?: boolean };

const SECTIONS: Section[] = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
  { id: "storage", label: "Storage" },
  { id: "privacy", label: "Privacy" },
  { id: "danger", label: "Danger zone", danger: true },
];

type SearchParams = Promise<{ billing?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUserOrRedirect("/settings");
  const { billing } = await searchParams;
  const supabase = await createClient();
  const [{ data: profile }, sub, usage] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, handle, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    getSubscription(user.id),
    getStorageUsage(user.id),
  ]);

  const plan = planForTier(sub.tier);
  const publicCount = (await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("is_public", true)).count ?? 0;

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

          <section
            id="billing"
            className="mt-14 max-w-2xl border-t border-[color:var(--color-ink)]/10 pt-10"
          >
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              Billing
            </h2>
            <div className="mt-4">
              <SubscriptionSection
                tier={sub.tier}
                status={sub.status}
                planName={plan.name}
                priceLabel={plan.priceLabel}
                storageLabel={plan.storageLabel}
                hasStripeCustomer={!!sub.stripe_customer_id}
                currentPeriodEnd={sub.current_period_end}
                cancelAtPeriodEnd={sub.cancel_at_period_end}
                stripeAvailable={stripeConfigured}
                billingFlash={billing ?? null}
              />
            </div>
          </section>

          <section
            id="storage"
            className="mt-14 max-w-2xl border-t border-[color:var(--color-ink)]/10 pt-10"
          >
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              Storage
            </h2>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/55">
              {formatGb(usage.bytes)} of {formatGb(usage.quotaBytes)} ·{" "}
              {usage.bookCount} books · {publicCount} public
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-ink)]/10">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.isOverQuota
                    ? "bg-red-500"
                    : usage.pctUsed > 80
                      ? "bg-amber-400"
                      : "bg-[color:var(--color-gold)]"
                }`}
                style={{ width: `${usage.pctUsed}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[color:var(--color-ink)]/50">
              {plan.name} · {plan.storageLabel} cap.{" "}
              {usage.isOverQuota
                ? "You're over your storage cap — upgrade or remove a book to add more."
                : usage.pctUsed > 80
                  ? "You're close to your cap. Consider upgrading before your next upload."
                  : "Plenty of room to keep adding books."}
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
