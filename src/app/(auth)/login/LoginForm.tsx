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
    <div className="space-y-7">
      <form onSubmit={onMagicLink} className="space-y-7">
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere.com"
            className="mt-2 block w-full border-b-2 border-[color:var(--color-ink)]/40 bg-transparent px-1 py-2 text-base tracking-normal text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/30 focus:border-[color:var(--color-gold)] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={pending !== null || !email}
          className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-gold)] px-6 py-3 text-sm font-medium text-[color:var(--color-leather)] shadow-[0_8px_24px_rgba(201,164,91,0.25)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === "email" ? "Sending…" : "Send magic link →"}
        </button>
      </form>

      <p className="text-sm text-[color:var(--color-ink)]/65">
        or{" "}
        <button
          type="button"
          onClick={onGoogle}
          disabled={pending !== null}
          className="inline-flex items-center gap-1.5 border-b border-[color:var(--color-ink)]/45 pb-0.5 text-[color:var(--color-ink)] transition hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] disabled:opacity-50"
        >
          <GoogleIcon />
          {pending === "google" ? "redirecting…" : "continue with Google"}
        </button>
      </p>

      {message && (
        <p className="text-sm text-[color:var(--color-gold)]">{message}</p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
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
