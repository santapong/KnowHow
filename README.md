# KnowHow

A 3D bookshelf PDF reader. Upload your novels, see them on a wooden shelf in 3D, click a spine to open a book, and flip through pages.

> **Status:** Phase 0 — scaffolding. See [`PLAN.md`](./PLAN.md) for the full roadmap.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript 5.7
- Tailwind CSS 4
- Supabase (Auth + Postgres + Storage) — wired in Phase 1
- `@react-three/fiber` + `pdfjs-dist` — added in Phase 5

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. Output: `.next` (default).
5. Set the env vars from [`.env.example`](./.env.example) — only `NEXT_PUBLIC_SITE_URL` is needed for the Phase 0 deploy. The Supabase vars become required in Phase 1.

## Scripts

- `npm run dev` — Next dev server with hot reload
- `npm run build` — production build
- `npm start` — run the production server locally
- `npm run lint` — Next.js / ESLint
- `npm run typecheck` — TypeScript only, no emit
