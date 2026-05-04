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
