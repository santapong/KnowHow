import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { supabaseConfigured } from "@/lib/env";

export const metadata = {
  title: "Sign in · KnowHow",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <aside
        aria-hidden
        className="relative hidden overflow-hidden border-r border-[color:var(--color-ink)]/10 bg-[#1a140d] md:block"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(201,164,91,0.16),transparent_60%)]" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[340px] w-[260px]">
            <BookCameo
              tilt={-6}
              offsetX={-26}
              offsetY={20}
              accent="rgba(201,164,91,0.55)"
              z={0}
              empty
            />
            <BookCameo
              tilt={3}
              offsetX={28}
              offsetY={-6}
              accent="rgba(201,164,91,0.4)"
              z={1}
              empty
            />
            <BookCameo
              tilt={-2}
              offsetX={0}
              offsetY={0}
              accent="var(--color-gold)"
              z={2}
              title="The Library"
              caption="entry pass"
            />
          </div>
        </div>

        <figure className="absolute inset-x-12 bottom-12 max-w-md">
          <blockquote className="font-serif text-lg italic leading-relaxed text-[color:var(--color-ink)]/75">
            &ldquo;A bookshelf is a private museum, curated by lamplight.&rdquo;
          </blockquote>
        </figure>
      </aside>

      <section className="relative flex flex-col justify-between p-8 md:p-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 self-start text-[color:var(--color-ink)]"
          aria-label="KnowHow home"
        >
          <span
            aria-hidden
            className="block h-7 w-5 rounded-[2px] border border-[color:var(--color-ink)]/60 bg-gradient-to-b from-[color:var(--color-gold)]/30 to-[color:var(--color-leather)]"
          />
          <span className="text-lg font-semibold tracking-tight">KnowHow</span>
        </Link>

        <div className="mx-auto w-full max-w-sm py-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
            step 1 of 1
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight">
            Step inside.
          </h1>
          <p className="mt-3 text-sm text-[color:var(--color-ink)]/65">
            One link, no password. Or use Google.
          </p>

          <div className="mt-10">
            {supabaseConfigured ? (
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            ) : (
              <SetupNotice />
            )}
          </div>
        </div>

        <Link
          href="/"
          className="self-start text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/50 hover:text-[color:var(--color-ink)]/80"
        >
          ← back to landing
        </Link>
      </section>
    </main>
  );
}

function BookCameo({
  tilt,
  offsetX,
  offsetY,
  accent,
  z,
  title,
  caption,
  empty,
}: {
  tilt: number;
  offsetX: number;
  offsetY: number;
  accent: string;
  z: number;
  title?: string;
  caption?: string;
  empty?: boolean;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 h-[300px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-black/40 shadow-2xl"
      style={{
        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) rotate(${tilt}deg)`,
        background: `linear-gradient(150deg, ${accent}, #1a0e08 130%)`,
        zIndex: z,
      }}
    >
      {!empty && (
        <div className="flex h-full flex-col justify-between p-5 text-[color:var(--color-ink)]">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/60">
            knowhow press
          </span>
          <div>
            <p className="font-serif text-2xl leading-tight tracking-tight">
              {title}
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/55">
              {caption}
            </p>
          </div>
        </div>
      )}
    </div>
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
