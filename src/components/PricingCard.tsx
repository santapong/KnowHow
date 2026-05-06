"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Plan, PlanTier } from "@/lib/stripe";
import { createCheckoutSession } from "@/actions/billing";

type Props = {
  plan: Plan;
  currentTier: PlanTier;
  signedIn: boolean;
};

export function PricingCard({ plan, currentTier, signedIn }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isCurrent = plan.tier === currentTier;
  const isFree = plan.tier === "free";
  const isHighlighted = plan.tier === "plus";

  function onCheckout() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    startTransition(async () => {
      const result = await createCheckoutSession({ tier: plan.tier });
      if (result.ok) {
        window.location.href = result.value.url;
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-7 ${
        isHighlighted
          ? "border-[color:var(--color-gold)]/60 bg-[color:var(--color-gold)]/[0.07]"
          : "border-[color:var(--color-ink)]/15 bg-[color:var(--color-ink)]/[0.02]"
      }`}
    >
      {isHighlighted && (
        <span className="absolute right-5 top-5 rounded-full bg-[color:var(--color-gold)] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-leather)]">
          Most popular
        </span>
      )}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
          {plan.tier}
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
          {plan.name}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink)]/65">
          {plan.blurb}
        </p>
      </div>

      <p className="mt-6 font-serif text-4xl font-semibold tracking-tight">
        {plan.priceLabel}
      </p>

      <ul className="mt-6 flex-1 space-y-2.5 text-sm text-[color:var(--color-ink)]/85">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5 text-[color:var(--color-gold)]">
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-7">
        {isCurrent ? (
          <span className="inline-flex w-full items-center justify-center rounded-md border border-[color:var(--color-ink)]/25 px-4 py-2.5 text-sm text-[color:var(--color-ink)]/55">
            Current plan
          </span>
        ) : isFree ? (
          <span className="inline-flex w-full items-center justify-center rounded-md border border-[color:var(--color-ink)]/15 px-4 py-2.5 text-sm text-[color:var(--color-ink)]/40">
            Default
          </span>
        ) : (
          <button
            type="button"
            onClick={onCheckout}
            disabled={pending || !plan.priceId}
            className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isHighlighted
                ? "bg-[color:var(--color-gold)] text-[color:var(--color-leather)] shadow-[0_8px_24px_rgba(201,164,91,0.25)] hover:opacity-90"
                : "border border-[color:var(--color-ink)]/25 text-[color:var(--color-ink)]/85 hover:border-[color:var(--color-ink)]/55"
            }`}
          >
            {!plan.priceId
              ? "Coming soon"
              : pending
                ? "Redirecting…"
                : `Choose ${plan.name}`}
          </button>
        )}
      </div>
    </div>
  );
}
