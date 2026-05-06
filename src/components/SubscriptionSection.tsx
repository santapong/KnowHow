"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { PlanTier } from "@/lib/stripe";
import { createBillingPortalSession } from "@/actions/billing";

type Props = {
  tier: PlanTier;
  status: string;
  planName: string;
  priceLabel: string;
  storageLabel: string;
  hasStripeCustomer: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeAvailable: boolean;
  billingFlash: string | null;
};

export function SubscriptionSection({
  tier,
  status,
  planName,
  priceLabel,
  storageLabel,
  hasStripeCustomer,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  stripeAvailable,
  billingFlash,
}: Props) {
  const [pending, startTransition] = useTransition();

  function openPortal() {
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if (result.ok) window.location.href = result.value.url;
      else alert(result.error);
    });
  }

  const renewLabel =
    currentPeriodEnd && status !== "canceled"
      ? new Date(currentPeriodEnd).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <div className="space-y-4">
      {billingFlash === "success" && (
        <p className="rounded-md border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/10 px-3 py-2 text-sm text-[color:var(--color-gold)]">
          Subscription updated — thanks for the support.
        </p>
      )}

      <div className="rounded-lg border border-[color:var(--color-ink)]/15 bg-[color:var(--color-ink)]/[0.02] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
              {tier}
              {status !== "active" && status !== "trialing" && ` · ${status}`}
              {cancelAtPeriodEnd && " · cancels at period end"}
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold tracking-tight">
              {planName}
            </p>
          </div>
          <p className="font-serif text-xl text-[color:var(--color-ink)]/85">
            {priceLabel}
          </p>
        </div>

        <p className="mt-3 text-sm text-[color:var(--color-ink)]/65">
          Storage cap: <strong>{storageLabel}</strong>
          {renewLabel && (
            <>
              {" "}· {cancelAtPeriodEnd ? "Ends" : "Renews"} {renewLabel}.
            </>
          )}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {tier === "free" ? (
            <Link
              href="/pricing"
              className="rounded-md bg-[color:var(--color-gold)] px-4 py-2 text-sm font-medium text-[color:var(--color-leather)] hover:opacity-90"
            >
              See plans →
            </Link>
          ) : (
            <button
              type="button"
              onClick={openPortal}
              disabled={pending || !stripeAvailable || !hasStripeCustomer}
              className="rounded-md border border-[color:var(--color-ink)]/25 px-4 py-2 text-sm text-[color:var(--color-ink)]/85 hover:border-[color:var(--color-ink)]/55 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Opening…" : "Manage billing"}
            </button>
          )}
          <Link
            href="/pricing"
            className="rounded-md border border-[color:var(--color-ink)]/15 px-4 py-2 text-sm text-[color:var(--color-ink)]/65 hover:border-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]/90"
          >
            View all plans
          </Link>
        </div>

        {!stripeAvailable && (
          <p className="mt-3 text-xs text-[color:var(--color-ink)]/45">
            Billing is in setup mode — Stripe keys aren&rsquo;t wired up yet.
          </p>
        )}
      </div>
    </div>
  );
}
