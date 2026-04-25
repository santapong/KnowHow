import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { supabaseConfigured } from "@/lib/env";

export const metadata = {
  title: "Sign in · KnowHow",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-10 block text-center text-xs uppercase tracking-[0.25em] text-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]/70"
        >
          ← KnowHow
        </Link>

        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight">
          Welcome
        </h1>
        <p className="mb-8 text-center text-sm text-[color:var(--color-ink)]/60">
          Sign in to your library.
        </p>

        {supabaseConfigured ? (
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        ) : (
          <SetupNotice />
        )}
      </div>
    </main>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-lg border border-[color:var(--color-gold)]/30 bg-[color:var(--color-gold)]/5 p-4 text-sm text-[color:var(--color-ink)]/80">
      <p className="mb-2 font-medium text-[color:var(--color-gold)]">
        Supabase not configured
      </p>
      <p>
        Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment, then
        reload. See <code>README.md</code>.
      </p>
    </div>
  );
}
