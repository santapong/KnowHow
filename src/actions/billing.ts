"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, planForTier, type PlanTier } from "@/lib/stripe";
import { env, stripeConfigured } from "@/lib/env";
import { getSubscription } from "@/lib/billing";

type Ok<T> = { ok: true; value: T };
type Fail = { ok: false; error: string };
type Result<T> = Ok<T> | Fail;

async function getOrCreateStripeCustomer(args: {
  userId: string;
  email: string | null;
}): Promise<string> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", args.userId)
    .maybeSingle();

  if (row?.stripe_customer_id) return row.stripe_customer_id;

  const customer = await stripe().customers.create({
    email: args.email ?? undefined,
    metadata: { user_id: args.userId },
  });

  // Service-role write: webhook is the canonical source, but we set the id
  // here so the next action call can find it.
  const service = await createServiceClient();
  await service
    .from("subscriptions")
    .upsert(
      { user_id: args.userId, stripe_customer_id: customer.id },
      { onConflict: "user_id" },
    );
  return customer.id;
}

export async function createCheckoutSession(input: {
  tier: PlanTier;
}): Promise<Result<{ url: string }>> {
  if (!stripeConfigured) {
    return { ok: false, error: "Billing isn't configured yet." };
  }
  if (input.tier === "free") {
    return { ok: false, error: "The free plan doesn't need a checkout." };
  }

  const plan = planForTier(input.tier);
  if (!plan.priceId) {
    return {
      ok: false,
      error: `No Stripe price ID set for the ${plan.name} plan.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const customerId = await getOrCreateStripeCustomer({
    userId: user.id,
    email: user.email ?? null,
  });

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${env.siteUrl}/settings?billing=success`,
    cancel_url: `${env.siteUrl}/pricing?billing=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: { user_id: user.id, tier: plan.tier },
    subscription_data: { metadata: { user_id: user.id, tier: plan.tier } },
  });

  if (!session.url) {
    return { ok: false, error: "Stripe didn't return a checkout URL." };
  }
  return { ok: true, value: { url: session.url } };
}

export async function createBillingPortalSession(): Promise<
  Result<{ url: string }>
> {
  if (!stripeConfigured) {
    return { ok: false, error: "Billing isn't configured yet." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const sub = await getSubscription(user.id);
  if (!sub.stripe_customer_id) {
    return {
      ok: false,
      error: "No Stripe customer yet — start a subscription first.",
    };
  }

  const portal = await stripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${env.siteUrl}/settings`,
  });
  revalidatePath("/settings");
  return { ok: true, value: { url: portal.url } };
}
