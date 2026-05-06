import { createClient } from "@/lib/supabase/server";
import { GB, planForTier, type PlanTier } from "@/lib/stripe";
import { listOwnBooks } from "@/lib/books";

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: PlanTier;
  status:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  storage_quota_bytes: number;
};

/**
 * Returns the user's subscription row. Falls back to a synthetic free-tier
 * row when no DB row exists yet (e.g. when the billing migration hasn't been
 * applied or the trigger hasn't backfilled).
 */
export async function getSubscription(
  userId: string,
): Promise<SubscriptionRow> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (
    data ?? {
      user_id: userId,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      tier: "free" as const,
      status: "active" as const,
      current_period_end: null,
      cancel_at_period_end: false,
      storage_quota_bytes: 1 * GB,
    }
  );
}

export type StorageUsage = {
  bytes: number;
  quotaBytes: number;
  bookCount: number;
  pctUsed: number;
  isOverQuota: boolean;
};

export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const [sub, books] = await Promise.all([
    getSubscription(userId),
    listOwnBooks(userId),
  ]);
  const bytes = books.reduce((sum, b) => sum + (b.size_bytes ?? 0), 0);
  const quotaBytes = sub.storage_quota_bytes ?? planForTier(sub.tier).storageBytes;
  const pctUsed =
    quotaBytes > 0 ? Math.min(100, (bytes / quotaBytes) * 100) : 0;
  return {
    bytes,
    quotaBytes,
    bookCount: books.length,
    pctUsed,
    isOverQuota: bytes > quotaBytes,
  };
}

export function formatGb(bytes: number): string {
  return (bytes / GB).toFixed(2) + " GB";
}
