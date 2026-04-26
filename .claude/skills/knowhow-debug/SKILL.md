---
name: knowhow-debug
description: Diagnostic helper for common KnowHow runtime failures (auth, upload, 3D scene, PDF rendering). Use when the user reports something broke during testing or UAT — "magic link doesn't arrive", "upload hangs", "shelf is blank", "page won't open in 3D", etc.
allowed-tools: Bash, Read, Grep, Edit
---

# KnowHow runtime diagnostic

The user has reported something broken. Triage in this order:

1. **Read the symptom carefully.** If they pasted an error, parse it before doing anything else. The symptom usually maps to one of the failure modes below.
2. **Don't run `npm run dev` blind** — the user is probably already running it. Read `/tmp/knowhow-dev.log` if it's there, or ask for the relevant log line.
3. **Fix on the current feature branch** — `claude/pdf-book-upload-animation-a4T5r`. Never push to `main`.

## Symptom → likely cause map

### Auth

| Symptom | Most likely cause | Where to look |
|---|---|---|
| Magic link email never arrives | Supabase free tier email delivery is throttled, or the user is on a custom domain with no SMTP | Supabase Studio → Auth → Email Templates → check rate; suggest custom SMTP for prod |
| Click magic link → "Invalid token" | The redirect URL on Supabase doesn't include the actual app origin | Supabase Studio → Auth → URL Configuration → add the app's URL to **Redirect URLs** |
| Sign-in works but `/shelf` redirects back to `/login` | Cookie not propagating; usually `NEXT_PUBLIC_SITE_URL` mismatch | Verify `NEXT_PUBLIC_SITE_URL` matches the URL the user is actually visiting (no trailing slash) |
| Google "Continue with Google" fails | OAuth redirect URI mismatch | Google Cloud Console → OAuth client → add Supabase's `https://<project>.supabase.co/auth/v1/callback` |
| Open-redirect concern after auth | `?next=` validation in `/auth/callback` | `src/app/auth/callback/route.ts:safeNext()` — only same-origin paths allowed |

### Upload

| Symptom | Most likely cause | Where to look |
|---|---|---|
| Drop a PDF → nothing happens | PDF.js worker failed to load from CDN | Browser console: look for `pdf.worker.min.mjs` 4xx/CSP error. `src/lib/pdf/worker.ts` uses `cdn.jsdelivr.net` — if blocked, copy the worker into `public/` and switch to `/pdf.worker.min.mjs` |
| Drop succeeds, "Add to my shelf" 401/403 | RLS blocked the insert | `supabase/migrations/0001_init.sql` `books insert own` policy; verify `owner_id = auth.uid()`. Check the user is signed in (`getUser()` must return a user) |
| Upload progress stalls at 60% | Storage signed URL expired or bucket missing | Supabase Studio → Storage → confirm `pdfs` bucket exists; re-run the migration if not |
| `SUPABASE_SERVICE_ROLE_KEY is not set` | Server-only env var missing | Vercel/.env.local must have `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never `NEXT_PUBLIC_*`) |
| Upload completes but cover image is broken | The cover bucket isn't public, or content-type wasn't `image/webp` | Supabase Studio → Storage → `covers` bucket public flag; `src/components/UploadDropzone.tsx` `uploadToSignedUrl` contentType |

### 3D scene

| Symptom | Most likely cause | Where to look |
|---|---|---|
| `/shelf` is a black rectangle | WebGL context not initialised | Browser console: `WebGL context lost` or `Failed to create WebGL context`. Hardware/driver issue — recommend `/shelf?view=grid` fallback |
| Spines clickable but nothing happens | Supabase RSC fetch returned 0 books, or click handler swallowed by another mesh | Verify `listOwnBooks` returns rows; check stopPropagation in `BookshelfScene.tsx` |
| Book opens but pages are blank | `PageTextureCache` failed to render | `src/lib/pdf/pageTextureCache.ts` — pdfjs worker again, or signed PDF URL expired (1h TTL) |
| 3D shelf is fine on desktop, broken on mobile Safari | iOS WebGL memory or texture-size limit | Push the user to grid view; v1 doesn't optimise mobile |
| Hovering a spine causes other spines to flicker | useFrame damp values fighting | `BookshelfScene.tsx:Spine` — should not happen; check no shared ref accidentally |

### General

| Symptom | Most likely cause | Where to look |
|---|---|---|
| `Cannot find module '@/...'` | TypeScript path alias broken | `tsconfig.json` `paths` and `baseUrl`; the next plugin sets them — verify `"plugins": [{"name": "next"}]` is intact |
| Build fails with "react-hooks/refs" | Reading a ref's `.current` during render | The lint rule is enforced in Next 16 + React 19; move the value to state or read inside an effect |
| `next dev` errors with proxy.ts deprecation | We renamed `middleware.ts` → `proxy.ts` for Next 16 | If the user has stale `.next/` cache, run `rm -rf .next && npm run dev` |
| `npm run build` warning about middleware deprecation | Stale `.next` build cache | `rm -rf .next && npm run build` |

## When the symptom doesn't match any of the above

1. Ask for: the exact error message (browser console + terminal), the URL where it failed, and which env vars are set.
2. Read the relevant file from the table closest to the symptom.
3. Don't guess fixes — verify the cause first by reading code and checking config.

## After fixing

- Run `/knowhow-status` to verify nothing regressed.
- Commit on the feature branch with a message that names the symptom and the fix.
- If the fix touches the architecture or shifts a deferred decision, append a one-liner to **CLAUDE.md → Changelog**. If it shifts the roadmap, append to **PLAN.md → Changelog**.

## Hard rules

- **Never push to `main`.** All fixes land on `claude/pdf-book-upload-animation-a4T5r`.
- **Never `npm audit fix --force`.** Documented in CLAUDE.md "Things to not change without asking".
- **Never reintroduce the deleted Python RAG code** (commit `e9492a0`).
