import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPriceId, planForTier, type PlanTier } from "@/lib/stripe";
import { env, stripeConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Only these events change subscription state we care about. Anything else
// is acked but ignored.
const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export async function POST(request: NextRequest) {
  if (!stripeConfigured || !env.stripeWebhookSecret) {
    return new NextResponse("Stripe webhook not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  // Stripe needs the raw bytes for HMAC verification — `text()` preserves
  // the body without normalisation.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      rawBody,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (err) {
    return new NextResponse(
      `Webhook signature verification failed: ${
        err instanceof Error ? err.message : "unknown"
      }`,
      { status: 400 },
    );
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else {
      await onSubscriptionEvent(event.data.object as Stripe.Subscription);
    }
    return NextResponse.json({ received: true, handled: true });
  } catch (err) {
    console.error("[stripe-webhook]", event.type, err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) return;
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  await onSubscriptionEvent(sub);
}

async function onSubscriptionEvent(sub: Stripe.Subscription) {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn(
      "[stripe-webhook] could not resolve user_id for subscription",
      sub.id,
    );
    return;
  }

  const item = sub.items.data[0];
  const priceId = item?.price.id ?? "";
  const tierFromPrice = tierForPriceId(priceId);
  const status = sub.status;
  // Drop coverage when status is canceled / unpaid / incomplete_expired.
  const tier: PlanTier =
    status === "canceled" || status === "unpaid" || status === "incomplete_expired"
      ? "free"
      : tierFromPrice ?? "free";

  const plan = planForTier(tier);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const periodEnd = item?.current_period_end ?? null;

  const service = await createServiceClient();
  await service.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      tier,
      status,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      storage_quota_bytes: plan.storageBytes,
    },
    { onConflict: "user_id" },
  );
}

async function resolveUserId(sub: Stripe.Subscription): Promise<string | null> {
  // Preferred: metadata we set at checkout-session creation.
  const metaUserId = sub.metadata?.user_id;
  if (metaUserId) return metaUserId;

  // Fallback: look up by stripe_customer_id.
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const service = await createServiceClient();
  const { data } = await service
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}
