"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/shelf";

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending("email");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    });
    setPending(null);
    if (err) setError(err.message);
    else setMessage("Check your inbox for the sign-in link.");
  }

  async function onGoogle() {
    setError(null);
    setPending("google");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (err) {
      setError(err.message);
      setPending(null);
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onGoogle}
        disabled={pending !== null}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-[color:var(--color-ink)]/20 bg-white/5 px-4 py-3 text-sm font-medium text-[color:var(--color-ink)] transition hover:bg-white/10 disabled:opacity-50"
      >
        <GoogleIcon />
        {pending === "google" ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/40">
        <span className="h-px flex-1 bg-[color:var(--color-ink)]/15" />
        or
        <span className="h-px flex-1 bg-[color:var(--color-ink)]/15" />
      </div>

      <form onSubmit={onMagicLink} className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/60">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 block w-full rounded-md border border-[color:var(--color-ink)]/20 bg-transparent px-3 py-2.5 text-sm tracking-normal text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/30 focus:border-[color:var(--color-gold)] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={pending !== null || !email}
          className="w-full rounded-md bg-[color:var(--color-gold)] px-4 py-3 text-sm font-medium text-[color:var(--color-leather)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending === "email" ? "Sending…" : "Send magic link"}
        </button>
      </form>

      {message && (
        <p className="text-center text-sm text-[color:var(--color-gold)]">
          {message}
        </p>
      )}
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.7-3.89 2.7-6.6Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.92v2.33A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.92A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.92 4.05l3.05-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.43 1.34l2.58-2.58A8.99 8.99 0 0 0 .92 4.95l3.05 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
