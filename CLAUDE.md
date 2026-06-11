# CLAUDE.md

> Project context for Claude Code sessions. Keep updated when architecture or status changes meaningfully. Detailed roadmap lives in [`PLAN.md`](./PLAN.md).
>
> **When you make a meaningful change, append a one-line entry to the [Changelog](#changelog) at the bottom of this file.** Mark architecture decisions, deferred work, and phase completions. Don't log routine commits.

## What this is

**KnowHow** — a 3D bookshelf PDF reader. Users upload novels (PDFs), see them as books on a 3D wooden shelf, click a spine to open a book, and flip through pages. Books are private by default with an opt-in "make public" toggle that surfaces them on `/community`.

**v1 explicitly excludes any AI / LLM / RAG features.** The previous incarnation of this repo was a Knowledge-Graph RAG Python project — that was deleted in favor of this v1.

## Status (as of 2026-04-26)

All 9 build phases from PLAN.md are **shipped to `claude/pdf-book-upload-animation-a4T5r`** and locally green:

| Phase | What | Status |
|---|---|---|
| 0 | Next.js scaffold | ✅ |
| 1 | Supabase wiring + DB migration | ✅ |
| 2 | Auth UI (magic link + Google) | ✅ |
| 3 | Upload flow + browser-side PDF parsing | ✅ |
| 4 | 2D PDF reader + reading-state persistence | ✅ |
| 5 | 3D bookshelf scene | ✅ |
| 6 | 3D book reader scene (flat page-spread, no bend shader) | ✅ |
| 7 | Public sharing + `/community` | ✅ |
| 8 | Cinematic 3D landing | ✅ |
| 9 | Settings + delete account + polish | ✅ |
| Bonus | Dockerfile + docker-compose | ✅ |

`npm run lint`, `npm run typecheck`, `npm run build` all clean. **Live functionality is unverified** — that needs a real Supabase project + Vercel deploy by the user.

## Tech stack (locked)

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript 5.7**
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **Supabase** — Auth (magic link + Google OAuth) + Postgres (with RLS) + Storage (signed-URL uploads)
- **`@react-three/fiber` 9 + `three` 0.184 + `@react-three/drei` 10** for 3D scenes
- **`pdfjs-dist` 5** for browser-side PDF parsing and page rendering
- **`zod` 4** for runtime validation
- **`react-dropzone`** for upload UX

ESLint pinned to 9.x because eslint-plugin-react isn't ESLint-10 compatible yet.

## Architecture

```
Browser (Next.js RSC + Server Actions + R3F client islands)
    │
    ├─ Reads via React Server Components, cookie-bound Supabase session
    ├─ Writes via Server Actions (zod-validated)
    └─ Uploads PUT directly to Supabase Storage via signed URLs
            (avoids Vercel's 4.5 MB Server Action body limit)
                │
                ▼
        Supabase: Auth + Postgres (RLS) + Storage
```

- `src/proxy.ts` (Next 16's renamed-from-`middleware.ts`) refreshes the Supabase auth cookie on every request and gates `/shelf`, `/upload`, `/settings` to signed-in users.
- `src/lib/supabase/{server,client,proxy}.ts` are the canonical helpers. Use `createClient()` from server.ts in RSCs/Server Actions; from client.ts in `"use client"` components; from proxy.ts only inside the proxy.
- `src/lib/supabase/server.ts` also exports `createServiceClient()` for service-role operations (account deletion, signed upload URLs). **Never use service-role from a client component.**

## Data model

See `supabase/migrations/0001_init.sql`. Tables: `profiles`, `books`, `reading_state`. Storage buckets: `pdfs` (private), `covers` (public). RLS policies enforce ownership; `is_public = true` makes a book readable by anyone.

The migration is **idempotent** — safe to re-run.

## Folder map

```
src/
├── app/
│   ├── (auth)/login/         magic link + Google OAuth
│   ├── (app)/shelf/          shelf list + 3D bookshelf
│   ├── (app)/shelf/[id]/     book reader (3D default, ?flat=1 for 2D)
│   ├── (app)/upload/         drag-drop PDF upload
│   ├── (app)/community/      public shelves
│   ├── (app)/settings/       profile + delete account
│   ├── auth/callback/        Supabase OAuth/magic-link code exchange
│   ├── auth/sign-out/        POST handler
│   ├── error.tsx             global error boundary
│   ├── loading.tsx           global suspense fallback
│   ├── not-found.tsx         404
│   └── page.tsx              cinematic landing
├── actions/
│   ├── createBook.ts         startBookUpload + finalizeBookUpload
│   ├── saveReadingState.ts   debounced last-page persistence
│   ├── toggleBookPublic.ts   + deleteBook
│   └── profile.ts            updateDisplayName + deleteAccount
├── components/               shared UI (Nav, BookActions, UploadDropzone, etc.)
├── scenes/                   R3F scenes (Landing, Bookshelf, BookReader)
│   └── BookReader3D.tsx      thin wrapper that dynamic-imports BookReaderScene
├── lib/
│   ├── supabase/             server.ts, client.ts, proxy.ts
│   ├── pdf/                  worker.ts, parse.ts, pageTextureCache.ts
│   ├── auth/getUser.ts       getOptionalUser + getUserOrRedirect
│   ├── env.ts                env vars + supabaseConfigured flag
│   ├── books.ts              data accessors (RSC-side)
│   └── validation.ts         zod schemas + SPINE_COLORS
└── proxy.ts                  Next 16 proxy (Supabase session refresh)
supabase/migrations/0001_init.sql
PLAN.md          deep plan with risks + v2 candidates
README.md        end-user setup walkthrough (local, Docker, Vercel)
Dockerfile + docker-compose.yml + .env.docker.example
```

## Conventions

- **Server Components by default**; only `"use client"` where you need state, effects, refs, or DOM events.
- **Server Actions** for all mutations — always start with `"use server"`, validate input with zod, return `{ ok: true } | { ok: false, error }`.
- **No `/api` routes** unless something can't be a Server Action (currently only `/auth/callback` and `/auth/sign-out`).
- **R3F scenes** are dynamic-imported with `ssr: false` from a "use client" wrapper so RSC pages can still fetch data on the server.
- **Refs are not read during render.** ESLint's `react-hooks/refs` rule enforces this — keep dynamic dependencies in state.
- **Tailwind v4** uses CSS-first config in `globals.css`; the only theme tokens are `--color-ink`, `--color-leather`, `--color-gold` and `--font-serif`.

## How to run

### Local against hosted Supabase (fastest test path)

1. Create Supabase project at https://supabase.com.
2. Paste `supabase/migrations/0001_init.sql` into Supabase SQL editor → Run.
3. Project Settings → API → copy URL, anon key, service_role key into `.env.local` (see `.env.example`).
4. Auth → URL Configuration → add `http://localhost:3000/auth/callback` to Redirect URLs.
5. `npm install && npm run dev`.

### Local Supabase via CLI

```bash
npx supabase start    # runs full Supabase stack in Docker
npx supabase status   # prints local URLs + keys
# paste keys into .env.local with NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
npm run dev
```

### Docker

```bash
cp .env.docker.example .env.docker  # fill in
docker compose up --build
```

## Open architectural decisions (deferred)

These were discussed and are *not* settled — when the user revisits, the choices need conscious confirmation:

1. **Postgres-only mode (no Supabase locally).** User asked if they can run with raw Postgres locally and migrate to Supabase for prod. This is **not** a config switch — Supabase is auth + storage + DB, not just DB. Doing it properly means swapping `@supabase/*` for NextAuth.js + Drizzle ORM + a storage abstraction (local-fs in dev, S3 in prod). ~2–3 days of focused rewrite. The lighter alternative is `npx supabase start` locally, which uses a real local Postgres they can `psql` into directly.
2. **3D book reader fidelity.** Currently flat page-spread planes that swap on click. A real bend-shader page-curl is roughly a day of work. User has not yet said which they want for v1.
3. **Open signup vs invite-only allowlist.** Public uploads of novels = real DMCA exposure. Currently open with a DMCA checkbox at upload time.
4. **Mobile experience.** Built fallback (`/shelf?view=grid`) but didn't optimize. User did not flag mobile as critical.

## v2 / future

See PLAN.md "v2 candidates" section. Highlights: AI/RAG chat, annotations, EPUB, PWA offline, Cloudflare R2 migration, paid storage tiers, page-curl bend shader.

## Project skills

Two slash commands live in `.claude/skills/`. The user can type them directly, and Claude will auto-invoke them when the description matches.

- **`/knowhow-status`** — runs lint + typecheck + build + dev-server route smoke test, prints a status table, and renders a verdict ("ready for UAT" or "needs fixes: ..."). Use proactively after a chunk of work, or when the user asks "is this ready?".
- **`/knowhow-debug`** — symptom→cause map for the common runtime failures (auth, upload, 3D scene, PDF rendering). Use when the user reports something broke during testing. The skill includes the hard rules ("never push to `main`", "never `npm audit fix --force`").

If you make changes that affect either skill (new failure mode discovered, smoke test step added), update the SKILL.md so future sessions inherit the knowledge.

## Things to not change without asking

- **Don't reintroduce the Python Knowledge-Graph RAG code.** It was deliberately deleted in commit `e9492a0`.
- **Don't push to `main`.** Always work on `claude/pdf-book-upload-animation-a4T5r` (or a new branch).
- **Don't `npm audit fix --force`.** It downgrades Next or breaks deps. Outstanding moderate findings are in transitive PostCSS inside Next's build tooling — not exploitable.
- **Don't add the React Compiler explicitly.** Next 16 ships it; lint rules `react-hooks/refs`, `react-hooks/set-state-in-effect`, `react-hooks/preserve-manual-memoization` already catch the patterns it cares about.

## Changelog

Reverse-chronological. Entries log architecture decisions, phase completions, and explicit deferrals. Routine commits and bug fixes go to git history, not here.

### 2026-06-11 — Consolidation: KnowHow chosen as the main repo over the Learning Platform
The user had a second repo, `santapong/Leaning-Platfrom` (a Next.js + Prisma + Auth.js **LMS**: instructors publish structured courses, learners enroll & track progress), and asked whether the two could be merged onto one main repo. They overlap only in theme ("a Next.js knowledge-content platform with AI deferred"), not in product shape — KnowHow is a reader, the other is a course platform.

- **Decided:** KnowHow is the **main repo**; the Learning Platform is **frozen** for active dev. KnowHow has the mature infra (Supabase auth/storage/RLS, Stripe billing, design system, 3D, pdfjs) that the LMS scaffold would otherwise rebuild from scratch. The valuable *code* is here; the valuable *vision* (courses + AI tutor) is salvaged from there.
- **Salvaged into `docs/lms-salvage/`:** the 5 AI agent specs (PM, curriculum-designer, tutor, content-reviewer, upload-coordinator) and the LMS course data model (`lms-data-model.prisma`). These reframe the vague "RAG chat" v2 line into a concrete AI direction.
- **Reframe (roadmap only, not built):** KnowHow grows from "3D novel reader" into a **learning library** — PDF reader becomes the lesson viewer, add course→module→lesson structure as a Supabase migration (port the salvaged model; keep Supabase, drop Prisma/Auth.js), wire the tutor agent on top. v1 functionality unchanged.
- **Full write-up:** [`docs/CONSOLIDATION.md`](./docs/CONSOLIDATION.md). The other repo's README now carries a freeze notice pointing here.
- **Built (first slice):** migration `0004_courses.sql` (`courses`/`modules`/`lessons`/`enrollments`/`lesson_progress`, RLS, with `lessons.book_id → books` so the reader is the lesson viewer); `src/lib/courses.ts` accessors; `src/actions/enroll.ts` (`enrollInCourse` + `setLessonProgress`); `/courses` catalog + `/courses/[slug]` detail; Nav "Courses" link. Lint/typecheck/build all clean; routes now include `/courses` + `/courses/[slug]`. **Deferred:** instructor authoring UI, lesson-complete control, 3D shelf-as-courses view, tutor agent. **Known limitation:** lesson books must be `is_public` for learners to read them (reader uses existing book RLS); private-content-via-enrollment needs a follow-up migration.

### 2026-05-06 — Stripe billing scaffold (Phase 10)
First-pass billing: subscription tiers (Free 1 GB / Plus 10 GB / Pro 100 GB) wired through Stripe Checkout + Customer Portal. Code is fully plumbed; the user just drops their Stripe keys + Price IDs in env to turn it on.

- **Migration `0003_billing.sql`** — `subscription_tier` + `subscription_status` enums; `subscriptions` table keyed on `user_id` with `stripe_customer_id`, `stripe_subscription_id`, `tier`, `status`, `current_period_end`, `cancel_at_period_end`, `storage_quota_bytes`. RLS: read-own; writes are service-role-only (webhook). New `handle_new_subscription()` trigger seeds a row when a profile is created; backfills existing profiles.
- **`src/lib/stripe.ts`** — server-side Stripe SDK init (lazy, pinned to `2026-04-22.dahlia`) + `getPlans()` catalogue (free / plus / pro) + `tierForPriceId()` reverse lookup. Price IDs are pulled from env (`STRIPE_PRICE_PLUS`, `STRIPE_PRICE_PRO`) so the user creates the products in their dashboard and just pastes the IDs.
- **`src/lib/billing.ts`** — `getSubscription(userId)` (synthetic free-tier fallback when no row exists) + `getStorageUsage(userId)` (bytes / quota / pct / over-quota flag) + `formatGb()`.
- **Server actions in `src/actions/billing.ts`** — `createCheckoutSession({tier})` lazily creates a Stripe customer, opens a Checkout subscription session with `success_url=/settings?billing=success` + `cancel_url=/pricing?billing=cancelled`. `createBillingPortalSession()` opens the Stripe-hosted Customer Portal for self-serve cancellation/upgrade.
- **Webhook at `src/app/api/stripe/webhook/route.ts`** — node runtime, raw-body HMAC verification via `webhooks.constructEvent`. Handles `checkout.session.completed` + the five `customer.subscription.*` events. Resolves `user_id` from `subscription.metadata.user_id` first, falls back to lookup-by-customer-id. On canceled / unpaid / incomplete_expired, downgrades to Free + resets quota to 1 GB.
- **`/pricing`** — three-card layout, Plus highlighted as "Most popular", per-card Choose-plan button hits `createCheckoutSession()` and `window.location.href`s to the returned URL. Signed-out clicks bounce through `/login?next=/pricing`. Amber warning banner when Stripe isn't configured.
- **`/settings` Billing section** — current plan + price + storage cap + renewal date + Cancels-at-period-end indicator; "Manage billing" button hits `createBillingPortalSession()`. Storage section now uses `getStorageUsage()` (real quota from subscription, gold/amber/red bar, dynamic copy at 80% / over).
- **Upload cap enforcement** — `startBookUpload` checks `getStorageUsage` against `parsed.data.sizeBytes` before issuing a signed URL; returns a typed error pointing at `/pricing`. Soft block at the action layer (signed URL is gated server-side, so the bytes never leave the browser if over cap).
- **Nav** — adds "Pricing" link for signed-out users (signed-in users have it on `/settings#billing`).
- **Env** — new vars in `.env.example`: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PLUS`, `STRIPE_PRICE_PRO`. New `assertStripeConfigured()` helper + `stripeConfigured` flag.
- **Setup the user still needs to do:** (1) Create three Stripe products with monthly recurring prices in their dashboard, copy the `price_…` IDs into env. (2) Set up a webhook endpoint in Stripe pointing at `${SITE_URL}/api/stripe/webhook` with the six events listed above; copy the `whsec_…` into `STRIPE_WEBHOOK_SECRET`. (3) Apply migration `0003_billing.sql` in the Supabase SQL editor.
- **Deferred:** annual pricing, team/family plans, usage-based metering. None planned for v1.

Verified: `npm run lint`, `npm run typecheck`, `npm run build` all clean. Routes now: `/`, `/login`, `/shelf`, `/shelf/[id]`, `/shelf/[id]/about`, `/upload`, `/community`, `/settings`, `/u/[handle]`, `/pricing`, `/api/stripe/webhook`, `/wireframes`. Smoke-tested: `/pricing` 200; webhook returns 503 when Stripe isn't configured (graceful, not a stack-trace).

### 2026-05-06 — SPOF audit fixes + missing-UI gap fixes
Worked through the audit findings end-to-end. Both the SPOFs and the gap-analysis items shipped together so the data model + UI and the runtime hardening land at the same time.

**SPOFs:**
- Self-host the pdf.js worker. Worker is now copied to `public/pdfjs/pdf.worker.min.mjs` by a `postinstall` script that resolves the file straight out of `node_modules/pdfjs-dist/build`. `src/lib/pdf/worker.ts` points `workerSrc` at `/pdfjs/pdf.worker.min.mjs` instead of `cdn.jsdelivr.net`. Reader no longer hard-fails if the CDN is blocked.
- Pin `pdfjs-dist` to an exact version (`5.6.205`, no `^`) so a transitive `pdfjs` minor doesn't silently change the worker API surface.
- `src/lib/env.ts` throws on boot when running in production with `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` missing. The `next build` phase is exempted (build can't read runtime secrets) so static generation still succeeds.
- `createServiceClient()` now goes through a `assertServiceRoleConfigured()` helper that throws a typed, user-readable error if `SUPABASE_SERVICE_ROLE_KEY` is missing — instead of letting Supabase return a confusing 500.
- New `src/components/SetupBanner.tsx` rendered above the layout when Supabase isn't configured. Replaces the silent-broken state with a visible amber strip.
- Excluded `public/pdfjs/**` from ESLint (the bundled worker is minified third-party code).

**Missing UI:**
- New migration `supabase/migrations/0002_genre_avatars.sql` (idempotent). Adds `books.genre` enum (`fiction | poetry | essays | history | philosophy | other`, default `other`), `profiles.handle` (unique, slug-safe, backfilled from email-prefix), an `avatars` storage bucket (2 MB cap, public read), and updates the `handle_new_user()` trigger to seed a unique handle for new sign-ups.
- New `src/lib/validation.ts` exports: `BOOK_GENRES`, `BOOK_GENRE_LABELS`, `BookGenre`, `handleSchema`. `createBookSchema` now requires `genre`.
- Genre is selected during upload (`UploadDropzone` — pill row above DMCA), persisted by `finalizeBookUpload`, and used to filter `/community` (real query param `?genre=fiction`, real DB filter via `listPublicBooks({ genre, query })`).
- Real search on `/shelf` (`?q=…` → `listOwnBooks(userId, query)` runs an `ilike` on title/author) and `/community` (same param, same SQL pattern). Two new client components: `ShelfSearch`, `CommunitySearch`.
- `/u/[handle]` route — public profile + that user's public shelf, fetched by `listBooksByOwnerHandle()`. Avatar (or initial), display name, handle, book count + total pages, 3D-vs-grid toggle, link back to `/community`.
- Avatar upload + display: new server actions `startAvatarUpload` / `finalizeAvatarUpload` issue a signed upload URL into the new `avatars` bucket, finalize updates `profiles.avatar_url`, and the action also prunes older avatar files for the same user. `SettingsForm` rebuilt around an avatar circle + display name + handle + email; `Nav` now renders the avatar (or initial) as a link to `/settings`.
- New route `/shelf/[id]/about` — book detail page with cover, title, author, genre badge, page count, file size, "shelved by" link, your-progress bar, and big "Resume reading →" / "Read in 2D" buttons.
- New `<ReaderTocPill>` client component: lazily loads the PDF outline (via `getOutline()` → `getDestination()` → `getPageIndex()`), renders a right-side drawer with chapter rows, navigates to `?page=N` when clicked. Reader page now respects `?page=N` (clamped to `[1, page_count]`) and uses it as `initialPage` over the persisted reading state.
- `error.tsx` rewritten — branches the message by `error.message` content (Supabase setup vs storage signed-URL issues vs unknown), shows `error.digest`, gives a "Back home" escape.
- Login: callback errors land in `?error=…`; `LoginForm` initializes its `error` state from that query param so the user sees the failure reason without a refresh-loop.

**Deferred / not done:**
- Reader chrome's `Aa` pill is still a placeholder (no font-size control yet).
- Supabase outage ⇒ status banner is config-only (`SetupBanner`); no health-poll for live outages.
- Upload retry-with-backoff for transient signed-URL upload failures still TBD; current code surfaces the raw error.

Verified: `npm run lint`, `npm run typecheck`, `npm run build` all clean. Routes now: `/`, `/login`, `/shelf`, `/shelf/[id]`, `/shelf/[id]/about`, `/upload`, `/community`, `/settings`, `/u/[handle]`, `/wireframes`.

### 2026-05-04 — Hi-fi pass on the remaining six screens (login / shelf / upload / reader / community / settings)
- **Decided:** **Bold** for login, shelf, upload, reader, community; **Safe** for settings. Bold matches the landing's "book is the interface" philosophy; Settings stays Safe because it's a utility screen where conventional left-rail + form helps users find things.
- **`/login`** (Bold, split-screen): left half — warm-leather pane with stacked `BookCameo` covers + tilted "The Library" entry-pass quote ("A bookshelf is a private museum, curated by lamplight."); right half — corner brand, "step 1 of 1 / Step inside." display + underline-style email field + primary "send magic link →" + Google as inline text-link with icon. `LoginForm` re-ordered: magic link first, Google as secondary text link.
- **`/shelf`** (Bold): full-width hero strip — eyebrow stats (`N books · X.X GB · last opened: …`) + serif "My shelf." headline; pills row (3D / Grid + + Upload primary); shelf rendered against a warm vertical gradient panel (no card containment).
- **`/upload`** (Bold, three-frame transformation): "File → Cover → Shelf." headline; `UploadDropzone` redesigned around three labelled stages (drop / cover / shelf-preview) connected by `Arrow`s that activate as the upload progresses; below — title / author / spine row + DMCA + "shelve it →" primary on the right.
- **`/shelf/[id]`** (Bold reader): replaced shared `<Nav>` with floating, opacity-fading `<ReaderChrome>` (left: ← shelf + book title mono; right: Aa pill + 3D/2D toggle). Chrome dissolves after 3s of no input and re-emerges on pointer/key/touch. 2D viewer wrapped in a centered max-w container; 3D stays full-bleed.
- **`/community`** (Bold): hero strip with stats (`{count} public books · {readers} readers`) + serif "The shared library." + filter pills (visual placeholders — All / Fiction / Poetry / Essays / History / Philosophy) + 3D/Grid toggle; shelf rendered against the warm gradient panel.
- **`/settings`** (Safe): left rail with Profile / Storage / Privacy / Danger zone anchors; main column with Profile (avatar circle + display name + email read-only via `SettingsForm`), Storage (real numbers from `listOwnBooks` — total GB used + book count + public count + 1 GB free-tier bar), Privacy (copy explaining per-book opt-in).
- **Shared `<Nav>`** updated to a hi-fi version of the wireframe AppBar: small book glyph + serif "KnowHow", right-aligned nav links with an `active` prop that paints a gold underline under the current section. Each app page passes its `active` key (shelf / upload / community / settings).
- **New: `src/components/ReaderChrome.tsx`** — `"use client"` opacity-fade wrapper; listens to pointermove / keydown / touchstart, sets `opacity: 1` and resets a 3s timer; collapses to `opacity: 0` when idle. `pointer-events-none` on the wrapper, `pointer-events-auto` on inner action groups, so clicks pass through to the 3D book.
- Verified locally: lint / typecheck / build all clean. Static routes still: `/`, `/login`, `/shelf`, `/upload`, `/wireframes`. Dynamic: `/community`, `/settings`, `/shelf/[id]` (unchanged).
- **Open:** UAT — needs a real Supabase project to actually exercise login / upload / reader. Direction is now picked end-to-end; next step is reacting to the live app.

### 2026-05-04 — Hi-fi pass on `/` landing — LandingBold direction
- **Decided:** carry the wireframes into the real app one screen at a time, hi-fi (proper type, real components, no sketch chrome). Starting with the landing as a sample so the user can react before we touch the other six screens.
- **Direction picked:** **Bold** for landing — full-bleed book-as-hero, asymmetric type bottom-left, body+CTA bottom-right, corner brand + corner sign-in (no shared `<Nav>`). Both chat transcripts called the book-opening the hero moment.
- `src/app/page.tsx`: rewritten. Drops the centered hero + shared `<Nav>`; adds corner brand top-left, "Sign in" top-right, eyebrow + huge serif "Read it like a book." headline bottom-left, body + "Begin →" CTA + "browse community" link bottom-right. R3F `LandingScene` stays as the full-bleed background. Mobile fallback stacks the corner blocks at the bottom.
- Typography: `--font-serif` (Georgia/Cambria from `globals.css`) for the display headline, Tailwind `font-mono` for eyebrow text. No new font dependencies — kept the change tight.
- Vignette: radial + bottom gradient over the canvas so text reads against the warm-leather backdrop.
- Verified locally: lint / typecheck / build clean; `/` is statically generated.
- **Open:** which direction (safe / bold) to apply to login / shelf / upload / reader / community / settings — awaiting user call after they look at this landing.

### 2026-05-04 — Wireframes pixel-pass against re-fetched design bundle
- Re-fetched the `KnowHow Wireframes.html` handoff bundle from `claude.ai/design` and diffed against the existing `/wireframes` port. The port from 2026-05-02 was already a faithful reproduction; only minor pixel discrepancies remained.
- `screens.tsx` `UploadBold`: restored the design's `bottom: 0` + `gap: 80` for the three-frame transformation row (was `bottom: 120` + `gap: 60`, which compressed the layout off-design).
- `screens.tsx` `ShelfBold` + `ReaderBold`: removed redundant wrapper `<span>` around `<Mono>`s with `marginLeft: 16`; pass the style directly to `<Mono>` to match the design's component composition.
- Storyboard remains self-contained — no app-route changes. Still awaiting user direction on which safe-vs-bold variants to carry into hi-fi.
- Verified locally: lint / typecheck / build clean; `/wireframes` is statically generated.

### 2026-05-02 — Wireframe storyboard ported to `/wireframes`
- Added `src/app/wireframes/` route that recreates the Claude Design wireframe handoff (7 screens × 2 directions = 14 frames + readme, plus 5-palette theme tweaks).
- Files: `page.tsx` (next/font/google for Architects Daughter / Caveat / IBM Plex Mono), `WireframesView.tsx` (canvas + tweaks panel), `components.tsx` (Box, Hand, Display, Mono, Squiggle, Spine, Cover, Note, Pill, Btn, Frame, AppBar primitives), `screens.tsx` (Landing/Login/Shelf/Upload/Reader/Community/Settings safe+bold), `wireframes.css` (theme tokens scoped via `data-theme` on artboard wrappers; CSS vars cascade into `.wf-root`).
- Storyboard is self-contained — no impact on existing app routes. Use it as the design reference when picking safe-vs-bold directions per screen for hi-fi work.
- Verified locally: lint / typecheck / build clean; `/wireframes` is statically generated.

### 2026-04-26 — Project skills added
- `.claude/skills/knowhow-status/SKILL.md` — pre-UAT verification (lint + typecheck + build + dev-server route smoke test). Auto-invokes on "is this ready?" type queries.
- `.claude/skills/knowhow-debug/SKILL.md` — runtime failure triage map. Auto-invokes on "X broke" reports. Encodes the hard rules ("never push to main", etc.).
- Both are user-invocable via `/knowhow-status` and `/knowhow-debug`.

### 2026-04-26 — Postgres-only mode discussion
- **Decided:** keep Supabase as the auth/storage/DB layer for both local dev and prod. Local dev path is `npx supabase start` (real local Postgres + Supabase services in Docker).
- **Rejected for now:** rewriting to NextAuth + Drizzle + S3 abstraction (~2–3 days of work, loses Studio + dashboard OAuth + managed magic-link emails). Logged in PLAN.md as a v2 candidate if vendor independence becomes a hard requirement.
- Free-tier limits documented: 500 MB DB / 1 GB storage / 5 GB bandwidth — storage is the cap that bites first; R2 migration is the planned escape hatch.

### 2026-04-26 — CLAUDE.md added for session continuity
- Captures current state, architecture, conventions, open decisions, and "don't change without asking" guardrails.
- Added this Changelog section so future sessions can append entries without fighting the file.

### 2026-04-26 — Docker support shipped
- Added `Dockerfile` (multi-stage, Next.js standalone output, non-root, ~150 MB image).
- Added `docker-compose.yml` with `host.docker.internal` extra-host so the container can reach a Supabase CLI running on the host.
- Added `.env.docker.example` documenting both hosted-Supabase and local-CLI configs.
- Real `docker build` not run (no daemon in dev sandbox); standalone build verified via `npm run build`.

### 2026-04-26 — Phases 1–9 shipped to `claude/pdf-book-upload-animation-a4T5r`
- Phase 1: Supabase wiring (`@supabase/ssr`, server/client/proxy helpers, `0001_init.sql` migration with RLS + storage policies + signup trigger).
- Phase 2: Auth UI (magic link + Google), `/auth/callback`, `/auth/sign-out`, `Nav`.
- Phase 3: Upload flow (drag-drop, browser-side `pdfjs-dist` parsing, signed-URL direct-to-storage upload, DMCA checkbox).
- Phase 4: 2D PDF reader, debounced `reading_state` save.
- Phase 5: 3D bookshelf scene with `@react-three/fiber`, hover slide-out, click-to-open, grid fallback.
- Phase 6: 3D book reader with opening animation and ±2 lazy texture window. **Deferred:** page-curl bend shader — flat page-spread planes for v1.
- Phase 7: Public sharing toggle, `/community`, book deletion.
- Phase 8: Cinematic 3D landing with auto-redirect for signed-in users.
- Phase 9: `/settings`, account deletion (cascades storage + auth user via service-role), error/loading/not-found, noscript fallback, README walkthrough.
- All phases verified locally: `npm run lint`, `npm run typecheck`, `npm run build` — clean.
- **Not yet verified live** — needs user's Supabase project + Vercel deploy.

### 2026-04-26 — Stack version bumps during scaffold
- Next 15.1.6 → 16.x (security CVE on 15.1.6).
- Tailwind 4.0.0 → 4.2.x (Turbopack compat with Next 16).
- ESLint 10 → 9 (eslint-plugin-react not yet ESLint-10 compatible).
- `middleware.ts` renamed to `proxy.ts` per Next 16 convention.

### 2026-04-25 — Project pivot: Knowledge-Graph RAG → KnowHow
- **Decided:** delete the prior Knowledge-Graph RAG / HyDE Python project (commit `e9492a0`) and rebuild as a 3D bookshelf PDF reader.
- **Decided:** v1 has zero AI / LLM / RAG features. AI is a v2 candidate.
- **Decided:** Next.js + Supabase + Vercel as the stack; `@react-three/fiber` for 3D; `pdfjs-dist` for PDFs.
- Created PLAN.md and Phase 0 scaffold (Next.js + Tailwind landing placeholder).
