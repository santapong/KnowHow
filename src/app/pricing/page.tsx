import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PricingCard } from "@/components/PricingCard";
import { getPlans } from "@/lib/stripe";
import { stripeConfigured } from "@/lib/env";
import { getOptionalUser } from "@/lib/auth/getUser";
import { getSubscription } from "@/lib/billing";

export const metadata = { title: "Pricing · KnowHow" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ billing?: string }>;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { billing } = await searchParams;
  const user = await getOptionalUser();
  const sub = user ? await getSubscription(user.id) : null;
  const currentTier = sub?.tier ?? "free";
  const plans = getPlans();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-12 pb-16 md:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
          plans &amp; pricing
        </p>
        <h1 className="mt-3 font-serif text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
          Read more, store more.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink)]/65">
          Start free with 1 GB. Upgrade when your library grows. Cancel any
          time from the billing portal.
        </p>

        {!stripeConfigured && (
          <p className="mt-6 max-w-2xl rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Billing isn&rsquo;t configured yet. Set <code>STRIPE_SECRET_KEY</code>,{" "}
            <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>,{" "}
            <code>STRIPE_WEBHOOK_SECRET</code>, and the price IDs to enable
            checkout — see <code>.env.example</code>.
          </p>
        )}

        {billing === "cancelled" && (
          <p className="mt-6 max-w-2xl rounded-md border border-[color:var(--color-ink)]/20 bg-[color:var(--color-ink)]/5 px-4 py-3 text-sm text-[color:var(--color-ink)]/75">
            Checkout cancelled. You&rsquo;re still on the {currentTier} plan.
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.tier}
              plan={plan}
              currentTier={currentTier}
              signedIn={!!user}
            />
          ))}
        </div>

        <p className="mt-12 text-sm text-[color:var(--color-ink)]/55">
          Already a subscriber?{" "}
          <Link
            href="/settings"
            className="border-b border-[color:var(--color-ink)]/35 pb-0.5 hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)]"
          >
            Manage your plan in Settings →
          </Link>
        </p>
      </main>
    </>
  );
}
