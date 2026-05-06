const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePricePlus = process.env.STRIPE_PRICE_PLUS ?? "";
const stripePricePro = process.env.STRIPE_PRICE_PRO ?? "";

const isProd = process.env.NODE_ENV === "production";
const missingPublic = !supabaseUrl || !supabaseAnonKey;

// Skip the prod-throw during `next build` so static generation can succeed
// without runtime secrets — the `supabaseConfigured` flag downstream handles
// rendering a "setup notice" instead of crashing.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

if (isProd && missingPublic && !isBuild) {
  throw new Error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY before starting the server.",
  );
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  siteUrl,
  serviceRoleKey,
  stripeSecretKey,
  stripeWebhookSecret,
  stripePublishableKey,
  stripePricePlus,
  stripePricePro,
};

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const stripeConfigured = Boolean(
  stripeSecretKey && stripePublishableKey && (stripePricePlus || stripePricePro),
);

/**
 * Throws a clear error when a server action / RSC needs the service-role key
 * but it isn't configured, instead of letting Supabase swallow it as a 500.
 */
export function assertServiceRoleConfigured(): void {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Server-side privileged " +
        "operations (uploads, account deletion) require it.",
    );
  }
}

/**
 * Throws when a server action tries to talk to Stripe but the secret key
 * isn't configured — e.g. local dev without billing.
 */
export function assertStripeConfigured(): void {
  if (!stripeSecretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Set the Stripe secret + publishable + " +
        "price IDs to enable billing.",
    );
  }
}
