import Stripe from "stripe";
import { assertStripeConfigured, env } from "@/lib/env";

let _client: Stripe | null = null;

/**
 * Server-side Stripe client. Lazily instantiated so importing this module
 * during build doesn't require the secret key.
 */
export function stripe(): Stripe {
  assertStripeConfigured();
  if (!_client) {
    _client = new Stripe(env.stripeSecretKey, {
      // Pin to the SDK's default API version so Stripe can't silently change
      // webhook payloads under us between deploys.
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
      appInfo: { name: "KnowHow", version: "0.1.0" },
    });
  }
  return _client;
}

export const GB = 1024 * 1024 * 1024;

export type PlanTier = "free" | "plus" | "pro";

export type Plan = {
  tier: PlanTier;
  name: string;
  blurb: string;
  priceLabel: string;
  storageBytes: number;
  storageLabel: string;
  features: string[];
  /** Stripe price ID — null for the Free tier. */
  priceId: string | null;
};

/**
 * Plans catalogue. Price IDs come from env so the user can plug in their
 * own without touching code.
 */
export function getPlans(): Plan[] {
  return [
    {
      tier: "free",
      name: "Reader",
      blurb: "A small library for casual reading.",
      priceLabel: "Free",
      storageBytes: 1 * GB,
      storageLabel: "1 GB",
      features: [
        "Up to 1 GB of PDFs",
        "Private 3D shelf",
        "2D + 3D reader",
        "Public sharing per book",
      ],
      priceId: null,
    },
    {
      tier: "plus",
      name: "Reader Plus",
      blurb: "For the regular reader.",
      priceLabel: "$4 / mo",
      storageBytes: 10 * GB,
      storageLabel: "10 GB",
      features: [
        "Everything in Reader",
        "10 GB of PDFs",
        "Priority cover rendering",
        "Larger uploads (up to 200 MB)",
      ],
      priceId: env.stripePricePlus || null,
    },
    {
      tier: "pro",
      name: "Reader Pro",
      blurb: "For libraries that grow.",
      priceLabel: "$12 / mo",
      storageBytes: 100 * GB,
      storageLabel: "100 GB",
      features: [
        "Everything in Plus",
        "100 GB of PDFs",
        "Up to 500 MB per upload",
        "Email support",
      ],
      priceId: env.stripePricePro || null,
    },
  ];
}

export function planForTier(tier: PlanTier): Plan {
  return getPlans().find((p) => p.tier === tier) ?? getPlans()[0];
}

/** Map a Stripe price ID back to a tier — for webhook handling. */
export function tierForPriceId(priceId: string): PlanTier | null {
  if (priceId && priceId === env.stripePricePlus) return "plus";
  if (priceId && priceId === env.stripePricePro) return "pro";
  return null;
}
