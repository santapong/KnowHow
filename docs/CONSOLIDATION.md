# Project consolidation: KnowHow + Learning Platform

> **Decision (2026-06-11):** KnowHow is the **main repo**. The separate
> `santapong/Leaning-Platfrom` (Learning Platform / LMS) is **frozen** for active
> feature work. Its reusable assets — the AI agent specs and the course data model —
> have been salvaged into this repo under [`docs/lms-salvage/`](./lms-salvage/) and
> fold into KnowHow's v2 roadmap as described below.

## Why these two repos existed

| | **KnowHow** (this repo) | **Learning Platform** (frozen) |
|---|---|---|
| Product | 3D bookshelf **PDF reader** — upload novels, read them on a wooden shelf | **LMS** — instructors publish structured courses (modules → lessons → video/Mermaid/exercises), learners enroll & track progress |
| Shape | Passive *reading* | Structured *teaching* |
| Maturity | Mature: 10 build phases + Stripe billing, design system, wireframes, hi-fi UI, Docker | Bootstrap scaffold: basic CRUD, 2 commits |
| Stack | Next 16 + Supabase (auth/storage/Postgres+RLS) + R3F/three + pdfjs + zod | Next 15 + Prisma/Neon + Auth.js v5 + Vercel Blob |
| AI | Excluded v1; "RAG chat" was a v2 candidate | Deferred too, but 5 agent specs already written |

They were never the *same* product — one is a reader, one is a course platform — but
they share a theme: **a Next.js platform for consuming knowledge content, with AI
deliberately deferred.** Rather than maintain two half-overlapping codebases, we
consolidate on the more mature one.

## Why KnowHow wins as the base

The hard infrastructure is already solved here and would have to be rebuilt from
scratch in the LMS scaffold:

- Auth, file storage (signed-URL direct upload), Postgres with RLS — all via Supabase.
- Stripe billing with tiers + quota enforcement (Phase 10).
- A full design system, wireframes, and hi-fi UI across every screen.
- 3D rendering (R3F) and browser-side PDF parsing/rendering.

The **valuable code** lives in KnowHow. The **valuable product vision** — courses,
instructors/learners, an AI tutor — lives in the Learning Platform. So we keep
KnowHow's code and absorb the LMS's *ideas*.

## What we keep, what we drop

- **Keep KnowHow's Supabase stack.** Do **not** adopt the LMS's Prisma + Auth.js layer
  — Supabase already covers auth + storage + billing more completely. The LMS data
  model is ported as a *Supabase migration*, not as Prisma.
- **Salvage the AI agent specs** ([`docs/lms-salvage/`](./lms-salvage/)) — PM,
  curriculum-designer, tutor, content-reviewer, upload-coordinator. These become the
  blueprint for KnowHow's deferred v2 AI layer, replacing the vaguer "RAG chat" line
  in PLAN.md. (Model identifier in those specs should be revisited against the current
  roster before wiring — they were written for an older Opus.)
- **Salvage the course data model** ([`docs/lms-salvage/lms-data-model.prisma`](./lms-salvage/lms-data-model.prisma))
  as the reference for the future `courses / modules / lessons / assets / exercises /
  enrollments / progress` Supabase migration.

## The reframe: KnowHow → a learning library

KnowHow stops being "read novels on a 3D shelf" and grows into **a learning library**:

1. The existing **PDF/content reader becomes the lesson viewer.**
2. Add a **course → module → lesson** structure on top (port the salvaged data model
   into a new `supabase/migrations/000X_courses.sql`).
3. Keep the **3D shelf** as the library browse metaphor — books become courses/lessons.
4. Wire the **tutor agent** on top of the reader as the v2 AI differentiator.

This is a roadmap direction, not a committed build. None of the above is implemented
yet — this document records the decision and the salvage so the next session can pick
it up. KnowHow's shipped v1 functionality is unchanged by this consolidation.

## Status of the other repo

`santapong/Leaning-Platfrom` is **frozen** — no new feature work. Its README carries a
notice pointing here. It is retained (not deleted) as the canonical source for anything
not yet salvaged. Reopen only if the strategic call is reversed.
