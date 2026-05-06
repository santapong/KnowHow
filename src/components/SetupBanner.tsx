import { supabaseConfigured } from "@/lib/env";

/**
 * Shown above the layout when the app is running without Supabase
 * credentials wired in — better than a confusing 500 page.
 */
export function SetupBanner() {
  if (supabaseConfigured) return null;
  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
      <strong className="font-semibold">Supabase not configured.</strong>{" "}
      Auth, upload, and reader are disabled. Set{" "}
      <code className="rounded bg-amber-500/15 px-1 py-0.5 font-mono">
        NEXT_PUBLIC_SUPABASE_URL
      </code>{" "}
      and{" "}
      <code className="rounded bg-amber-500/15 px-1 py-0.5 font-mono">
        NEXT_PUBLIC_SUPABASE_ANON_KEY
      </code>{" "}
      and reload — see <code>README.md</code>.
    </div>
  );
}
