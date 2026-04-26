# KnowHow

A 3D bookshelf PDF reader. Upload your novels, see them on a wooden shelf in 3D, click a spine to open a book, and flip through pages.

> **Status:** v1 in development. See [`PLAN.md`](./PLAN.md) for the roadmap.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript 5.7
- Tailwind CSS 4
- Supabase — Auth (magic link + Google OAuth) + Postgres + Storage
- `@react-three/fiber` + `pdfjs-dist` for 3D and PDF rendering

## Local development

```bash
npm install
cp .env.example .env.local
# fill in Supabase + site URL
npm run dev
```

Open http://localhost:3000.

## Setting up Supabase

1. Create a project at https://supabase.com (free tier is fine).
2. **SQL** → open `supabase/migrations/0001_init.sql` in this repo and run it in the Supabase SQL editor. Idempotent — safe to re-run.
3. **Project Settings → API** → copy the **Project URL** and **anon public** key into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
4. Copy the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY` (never expose this to the client).
5. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (dev) or your production URL.
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`, your Vercel preview URLs, and your production URL.
6. **Authentication → Providers → Google**: enable, paste in your Google OAuth client ID + secret. (See "Google OAuth" below.)
7. **Storage**: the migration created `pdfs` (private) and `covers` (public) buckets with the right policies. Verify in **Storage**.

## Google OAuth (5 minutes)

1. https://console.cloud.google.com → Create project.
2. **APIs & Services → OAuth consent screen** → External → fill required fields.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
4. **Authorized redirect URIs**: add Supabase's callback URL (shown in **Auth → Providers → Google** in Supabase Studio). It looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
5. Copy the client ID + secret into Supabase **Auth → Providers → Google**.

## Run with Docker

> **Important:** the app uses Supabase's **Auth** and **Storage** APIs, not raw Postgres. A standalone Postgres container won't work as a backend. The Docker setup runs the **app**; the Supabase backend can be hosted, run via the Supabase CLI, or fully self-hosted.

### Path 1 — Hosted Supabase (production-like)

```bash
cp .env.docker.example .env.docker
# fill in the three Supabase keys + your site URL
docker compose --env-file .env.docker up --build
```

App on http://localhost:3000.

### Path 2 — Local Supabase via CLI (recommended for dev)

In one terminal:

```bash
npx supabase init   # one-time, generates supabase/config.toml
npx supabase start  # boots the full Supabase stack in Docker
npx supabase status # prints local URLs + anon/service keys
```

The CLI auto-runs anything in `supabase/migrations/` — the schema is already there.

In another terminal:

```bash
cp .env.docker.example .env.docker
# In .env.docker, set:
#   NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
#   SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase status>
docker compose --env-file .env.docker up --build
```

App on http://localhost:3000, Supabase Studio on http://localhost:54323.

### Path 3 — Self-hosted Supabase

Use the upstream compose at https://github.com/supabase/supabase/tree/master/docker — it bundles auth (GoTrue), storage, postgres, studio, kong, realtime. Point this app at its API gateway URL via `.env.docker`.

### Notes

- The `Dockerfile` is multi-stage and uses Next.js's `output: 'standalone'` for a slim final image (~150 MB).
- `NEXT_PUBLIC_*` env vars are baked into the client bundle **at build time**. If you change them you must rebuild the image (`docker compose --env-file .env.docker up --build`).
- Server-only env vars (`SUPABASE_SERVICE_ROLE_KEY`) are read at runtime, so changing them only needs `docker compose restart`.

## Deploy to Vercel

1. Import this repo at https://vercel.com/new.
2. Framework: **Next.js** (auto-detected).
3. **Environment variables** — add all four from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` — set to your Vercel preview URL (e.g. `https://knowhow-xxx.vercel.app`) for previews; change to your production URL on the production environment.
4. Deploy.
5. After the first deploy, **add the Vercel URL to Supabase Auth → URL Configuration → Redirect URLs**. Otherwise OAuth callbacks will fail.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev server, hot reload |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Run the production server locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript only, no emit |

## Folder layout

```
src/
├── app/
│   ├── (auth)/login/         magic link + Google
│   ├── (app)/shelf/          3D shelf + book reader
│   ├── (app)/upload/         drag-drop PDF upload
│   ├── (app)/community/      public shelves
│   ├── (app)/settings/       profile + delete account
│   ├── auth/callback/        Supabase code-exchange
│   ├── auth/sign-out/        POST handler
│   └── page.tsx              cinematic landing
├── actions/                  Server Actions (typed mutations)
├── components/               shared UI
├── scenes/                   R3F scenes (landing, shelf, reader)
├── lib/
│   ├── supabase/             server, client, proxy helpers
│   ├── pdf/                  pdfjs worker + page-texture cache
│   ├── auth/                 getOptionalUser / getUserOrRedirect
│   └── books.ts              data accessors
├── proxy.ts                  Next 16 proxy (Supabase session refresh)
└── ...
supabase/migrations/0001_init.sql
PLAN.md
```

## Known limitations (v1)

- **No annotations / bookmarks / highlights.** v2.
- **No EPUB.** PDF only.
- **No AI / RAG / chat with novel.** Out of scope.
- **3D book reader uses simple page-spread planes**, not a bend shader. Looks good but doesn't curve. Bend shader is a v1.5 polish item.
- **Mobile**: rendering works but the 3D shelf is desktop-first. Use the **Grid view** link on `/shelf` for a fast 2D fallback.
- **Free Supabase** caps storage at 1 GB; large libraries will need a paid tier or a migration to Cloudflare R2.
