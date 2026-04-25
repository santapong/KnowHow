# KnowHow — 3D Bookshelf PDF Reader (v1) — Deep Plan

> v1 has **zero AI / LLM** integration. Pure 3D bookshelf + PDF reader + auth + uploads.

## 1. Goal & Non-goals

**Goal (v1):** A public-signup web app where a user uploads novel PDFs, sees them as books on a 3D bookshelf, picks one, the book opens in 3D, and they flip through pages. Books are private by default; user can publish a book to a community shelf.

**Non-goals (v1):**
- No AI / LLM / RAG / chat-with-novel
- No annotations, highlights, bookmarks
- No comments / likes / social features
- No mobile-first (working mobile fallback only; 3D is desktop-first)
- No payments / subscriptions
- No EPUB / MOBI — PDF only
- No server-side PDF processing — all rendering happens in the browser

## 2. Tech stack — final picks with versions

Picked for: maintained in 2026, large community, Vercel-friendly, beginner-tractable.

### Runtime & tooling
| Tool | Version | Why |
|---|---|---|
| Node.js | 22 LTS | Vercel default |
| npm | 10.x | Bundled with Node 22 |
| TypeScript | 5.7+ | Required by Next 16 |

### Framework
| Tool | Version | Why |
|---|---|---|
| Next.js | 16.x (App Router, Turbopack default) | First-class on Vercel, RSC + Server Actions |
| React | 19.x | Required by Next 16 |

### Styling / UI
| Tool | Version |
|---|---|
| Tailwind CSS | 4.x |
| shadcn/ui | latest CLI |
| lucide-react | latest |

### 3D
| Tool | Version |
|---|---|
| three | 0.170.x |
| @react-three/fiber | 9.x |
| @react-three/drei | 10.x |
| @use-gesture/react | 10.x |

### PDF
| Tool | Version |
|---|---|
| pdfjs-dist | 4.x |

> PDF pages render to canvas → used as Three.js `CanvasTexture`. No server-side image conversion. Lazy-render only pages within ±2 of current.

### Backend / data
| Tool | Version |
|---|---|
| @supabase/supabase-js | 2.x |
| @supabase/ssr | 0.5.x |
| zod | 3.x |

### State / utilities
| Tool | Version |
|---|---|
| zustand | 5.x |
| @tanstack/react-query | 5.x |

### Hosting
- **Vercel** Hobby (free) — Next.js
- **Supabase** Free — Auth + Postgres + Storage

### Dev experience
- ESLint + Prettier
- Husky + lint-staged
- Vitest (unit)
- Playwright (E2E)

## 3. System architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser (Next.js)                      │
│  Public UI       Auth'd UI         3D Reader                 │
│  /, /community   /shelf, /upload   /shelf/[id]               │
│            │             │                │                  │
│  ┌─────────▼─────────────▼────────────────▼───────────────┐  │
│  │ Server Components + Server Actions                    │  │
│  │ - read books (RSC)                                    │  │
│  │ - signed upload URLs (Server Action)                  │  │
│  │ - toggle is_public (Server Action)                    │  │
│  └─────┬─────────────────────────────────────────────────┘  │
│        │ @supabase/ssr (cookie-bound)                       │
└────────┼────────────────────────────────────────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Supabase: Auth + Postgres (RLS) + Storage (signed URLs)     │
└──────────────────────────────────────────────────────────────┘
```

- Reads use RSC with cookie-bound session — no client roundtrip.
- Writes use Server Actions — type-safe, no `/api` routes for v1.
- Uploads bypass the server — client gets a signed upload URL, PUTs directly to Storage. Avoids Vercel's 4.5 MB body limit.
- PDFs render entirely client-side — zero server CPU.

## 4. Data model

```sql
profiles (
  id            uuid PK references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz default now()
);

books (
  id            uuid PK default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  title         text not null,
  author        text,
  page_count    int  not null,
  spine_color   text not null default '#8B4513',
  cover_path    text not null,
  pdf_path      text not null,
  size_bytes    bigint not null,
  is_public     boolean not null default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index books_owner_idx  on books(owner_id);
create index books_public_idx on books(is_public) where is_public = true;

reading_state (
  user_id    uuid not null references profiles(id) on delete cascade,
  book_id    uuid not null references books(id)    on delete cascade,
  last_page  int  not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, book_id)
);
```

### RLS
- **profiles**: read any; update own.
- **books**: SELECT `owner_id = auth.uid() OR is_public`; INSERT/UPDATE/DELETE own.
- **reading_state**: read/write own.

### Storage
- `pdfs` (private) — `{user_id}/{book_id}.pdf` — signed URLs (1 h TTL).
- `covers` (public) — `{user_id}/{book_id}.webp`.

## 5. Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | RSC | 3D landing — book opens, "Sign up" CTA |
| `/login` | Client | Magic link + Google |
| `/auth/callback` | Route Handler | Supabase OAuth/magic-link landing |
| `/shelf` | RSC | User's private 3D bookshelf |
| `/shelf/[id]` | Client | 3D book opens + page-flip reader |
| `/shelf/[id]?flat=1` | Client | 2D fallback reader |
| `/upload` | Client | Drag-drop, parse PDF, upload |
| `/community` | RSC | 3D shelf of public books |
| `/settings` | Server Action | Profile + delete account |

## 6. PDF rendering pipeline

### Upload (client)
1. User drops a PDF (`File`).
2. `pdfjs-dist`: extract `numPages`, title, author.
3. Render page 1 → 600×900 canvas → WebP cover.
4. Validate (≤100 MB, real PDF magic bytes, page count > 0).
5. Server Action returns two signed upload URLs.
6. Client `PUT`s both directly to Storage.
7. Server Action inserts `books` row.

### Read (3D reader)
1. Fetch signed URL for the PDF.
2. `pdfjs.getDocument(url)`.
3. Maintain a window: pages `[current-2, current+2]` rendered to canvases; others disposed.
4. Each canvas → `THREE.CanvasTexture` → page mesh.
5. On flip, the texture for the incoming page renders just-in-time if not cached.

**Page-mesh strategy:** two `BoxGeometry` covers + N thin `PlaneGeometry` pages with a bend shader animated 0 → 1 on flip. Front face = current page texture, back = next.

## 7. Auth flow

1. Magic link: `signInWithOtp({ email })` → email → `/auth/callback?code=...` → cookie session → `/shelf`.
2. Google OAuth: `signInWithOAuth({ provider: 'google' })` → callback → cookie session.
3. Profile row created via Postgres trigger `on_auth_user_created`.
4. Session via `@supabase/ssr` in `middleware.ts`.

## 8. 3D scene architecture

Three scenes under `src/scenes/`:

- **LandingScene** — single rotating book; click → opens, fades to sign-up form.
- **BookshelfScene** — procedural shelf, one `BookSpine` mesh per book row. Hover slides spine out 5 cm; click → reader.
- **BookReaderScene** — closed book lifts and opens; drag right edge or click corner to flip; bottom HUD (page #, slider, exit).

Mobile fallback: CSS-grid cover view + 2D flipbook if WebGL fails or width < 768 px.

## 9. Build phases

Each phase ends with: passing tests + green CI + deployable preview on Vercel.

### Phase 0 — Wipe & init (~30 min) — **THIS COMMIT**
- Delete Python files.
- Scaffold Next.js + Tailwind + TS at repo root.
- Push to `claude/pdf-book-upload-animation-a4T5r`.
- **Acceptance:** Vercel preview shows landing placeholder.

### Phase 1 — Supabase wiring (~1 hr)
- Create Supabase project; add env vars to Vercel.
- Migration SQL: tables, RLS, buckets, profile-creation trigger.
- `middleware.ts` + `lib/supabase/{server,client,middleware}.ts`.
- **Acceptance:** manually-inserted books row visible to owner only.

### Phase 2 — Auth UI (~1 hr)
- `/login` magic link + Google.
- Configure Google OAuth client + redirect URIs.
- `/auth/callback` route handler.
- Logged-in nav with avatar + sign-out.
- **Acceptance:** sign up + sign in via both methods; profile row exists.

### Phase 3 — Upload flow (~3 hrs)
- `/upload` drag-drop with `react-dropzone`.
- Client PDF parsing → page count, title, cover.
- Spine-color picker (6 presets).
- `createBook` Server Action: zod-validated; returns signed upload URLs; inserts row after both PUTs succeed.
- Progress bar.
- **Acceptance:** upload a 20 MB novel; row in DB; both files in Storage; cover viewable.

### Phase 4 — 2D reader (~2 hrs)
- `/shelf/[id]?flat=1`: simple `pdfjs-dist` viewer.
- Prev/next + arrow keys.
- `reading_state` upsert on page change (debounced 2 s).
- **Acceptance:** open book at last-read page; progress saved across reloads.

### Phase 5 — 3D bookshelf (~6 hrs)
- `BookshelfScene` with R3F.
- Procedural shelf; spines per book; titles via `CanvasTexture`.
- Hover + click.
- 2D grid fallback.
- **Acceptance:** 5 books at 60 fps on a mid-range laptop; click → reader.

### Phase 6 — 3D book reader (~10 hrs)
- `BookReaderScene` with opening animation.
- Bend shader for page mesh.
- ±2 lazy texture window.
- Gesture-driven flip with momentum.
- Reading state sync.
- HUD.
- **Acceptance:** 200-page novel; 20 forward flips + 5 back without stutter.

### Phase 7 — Public sharing + community (~2 hrs)
- "Make public" toggle.
- DMCA acknowledgement at upload (mandatory).
- `/community` route — same `BookshelfScene`, public data source.
- **Acceptance:** A makes public; B sees on `/community` and reads.

### Phase 8 — Cinematic 3D landing (~3 hrs)
- `LandingScene` at `/`.
- Book opens; headline + CTA fade in.
- "Skip animation" link.
- Redirect to `/shelf` if logged in.

### Phase 9 — Polish (~3 hrs)
- Loading skeletons, error boundaries.
- `<noscript>` and WebGL-disabled fallbacks.
- Settings page: change display name, delete account (cascades).
- Lighthouse a11y ≥ 90.

**Total estimate: ~30 focused hours.**

## 10. Testing strategy

- **Unit (Vitest)**: PDF metadata extraction, zod schemas, signed-URL helpers.
- **E2E (Playwright)** on preview deploys:
  1. Magic-link sign-up.
  2. Upload 1-page test PDF.
  3. Open in 2D reader; assert page count.
  4. Toggle public; second user sees it.
  5. Delete account; Storage purged.
- **3D**: smoke test "scene mounts without throwing"; manual verification.

## 11. Folder layout

```
KnowHow/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/auth/callback/route.ts
│   │   ├── (app)/shelf/page.tsx
│   │   ├── (app)/shelf/[id]/page.tsx
│   │   ├── (app)/upload/page.tsx
│   │   ├── (app)/community/page.tsx
│   │   ├── (app)/settings/page.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/            (shadcn)
│   │   ├── BookCard.tsx
│   │   ├── UploadDropzone.tsx
│   │   └── Nav.tsx
│   ├── scenes/
│   │   ├── LandingScene.tsx
│   │   ├── BookshelfScene.tsx
│   │   └── BookReaderScene.tsx
│   ├── lib/
│   │   ├── supabase/{server,client,middleware}.ts
│   │   ├── pdf/parse.ts
│   │   ├── pdf/renderPage.ts
│   │   └── validation.ts
│   ├── actions/
│   │   ├── createBook.ts
│   │   ├── toggleBookPublic.ts
│   │   └── deleteAccount.ts
│   ├── stores/
│   │   └── readerStore.ts
│   └── middleware.ts
├── supabase/migrations/0001_init.sql
├── tests/{unit,e2e}/
├── public/
├── .env.example
└── package.json
```

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 3D laggy on mobile | 2D fallback baked in from Phase 4 |
| Vercel 4.5 MB Server Action limit | Direct-to-Storage signed-URL uploads from Phase 3 |
| Supabase 1 GB Storage cap | Acceptable for v1; document R2 migration |
| PDF.js worker mis-config in Next | Centralize in `lib/pdf/`; document workerSrc |
| Copyright | Mandatory DMCA checkbox; `is_public` defaults false |
| Bend shader breaks on some GPUs | Feature-detect; fall back to slide animation |

## 13. v2 candidates

- RAG/AI chat (resurrect deleted Python via TS/OpenAI Assistants).
- Annotations, highlights, bookmarks.
- EPUB support.
- Offline reading (PWA).
- Cloudflare R2 migration.
- Per-user storage quotas with paid tiers.

## 14. Required env vars (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

`NEXT_PUBLIC_SITE_URL` is needed for OAuth redirects. Set to your Vercel preview URL during dev and your production URL on prod.
