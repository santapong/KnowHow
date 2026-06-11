-- =============================================================
--  KnowHow — phase-4 migration: course structure (LMS layer)
--  Ports the salvaged Learning Platform data model
--  (docs/lms-salvage/lms-data-model.prisma) into Supabase idioms,
--  integrated with the existing books/profiles/reading_state schema.
--
--  The core integration: a lesson points at an existing `books` row,
--  so KnowHow's PDF reader becomes the lesson viewer.
--
--  Idempotent — safe to re-run.
--
--  KNOWN LIMITATION (documented, future migration): a lesson's book
--  must be `is_public = true` to be readable by enrolled learners,
--  because the reader relies on the existing books/PDF RLS. Per-
--  enrollment access to *private* lesson PDFs is deferred.
-- =============================================================

-- 1. courses ---------------------------------------------------
create table if not exists public.courses (
  id            uuid primary key default uuid_generate_v4(),
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  slug          text not null,
  title         text not null,
  description   text not null default '',
  cover_path    text,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists courses_slug_unique on public.courses(lower(slug));
create index if not exists courses_instructor_idx on public.courses(instructor_id);
create index if not exists courses_published_idx on public.courses(is_published) where is_published = true;

alter table public.courses enable row level security;

drop policy if exists "courses select published or own" on public.courses;
create policy "courses select published or own"
  on public.courses for select
  using (is_published = true or auth.uid() = instructor_id);

drop policy if exists "courses insert own" on public.courses;
create policy "courses insert own"
  on public.courses for insert
  with check (auth.uid() = instructor_id);

drop policy if exists "courses update own" on public.courses;
create policy "courses update own"
  on public.courses for update
  using (auth.uid() = instructor_id);

drop policy if exists "courses delete own" on public.courses;
create policy "courses delete own"
  on public.courses for delete
  using (auth.uid() = instructor_id);

-- 2. modules ---------------------------------------------------
create table if not exists public.modules (
  id         uuid primary key default uuid_generate_v4(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  position   int  not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (course_id, position)
);

create index if not exists modules_course_idx on public.modules(course_id);

alter table public.modules enable row level security;

-- Visible when the parent course is visible (published or owned).
drop policy if exists "modules select via course" on public.modules;
create policy "modules select via course"
  on public.modules for select
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (c.is_published = true or c.instructor_id = auth.uid())
    )
  );

drop policy if exists "modules write via owned course" on public.modules;
create policy "modules write via owned course"
  on public.modules for all
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.instructor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.instructor_id = auth.uid()
    )
  );

-- 3. lessons ---------------------------------------------------
create table if not exists public.lessons (
  id             uuid primary key default uuid_generate_v4(),
  module_id      uuid not null references public.modules(id) on delete cascade,
  title          text not null,
  position       int  not null check (position >= 0),
  content        text not null default '',
  -- The lesson's primary content: an existing book read in the reader.
  book_id        uuid references public.books(id) on delete set null,
  video_url      text,
  diagram_source text,
  created_at     timestamptz not null default now(),
  unique (module_id, position)
);

create index if not exists lessons_module_idx on public.lessons(module_id);
create index if not exists lessons_book_idx on public.lessons(book_id);

alter table public.lessons enable row level security;

-- Visible when the lesson's course is visible (published or owned).
drop policy if exists "lessons select via course" on public.lessons;
create policy "lessons select via course"
  on public.lessons for select
  using (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (c.is_published = true or c.instructor_id = auth.uid())
    )
  );

drop policy if exists "lessons write via owned course" on public.lessons;
create policy "lessons write via owned course"
  on public.lessons for all
  using (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.instructor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.instructor_id = auth.uid()
    )
  );

-- 4. enrollments -----------------------------------------------
create table if not exists public.enrollments (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  course_id  uuid not null references public.courses(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists enrollments_course_idx on public.enrollments(course_id);

alter table public.enrollments enable row level security;

drop policy if exists "enrollments read own" on public.enrollments;
create policy "enrollments read own"
  on public.enrollments for select
  using (auth.uid() = user_id);

drop policy if exists "enrollments insert own" on public.enrollments;
create policy "enrollments insert own"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

drop policy if exists "enrollments delete own" on public.enrollments;
create policy "enrollments delete own"
  on public.enrollments for delete
  using (auth.uid() = user_id);

-- 5. lesson_progress -------------------------------------------
create table if not exists public.lesson_progress (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id)  on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id);

alter table public.lesson_progress enable row level security;

drop policy if exists "lesson_progress read own" on public.lesson_progress;
create policy "lesson_progress read own"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

drop policy if exists "lesson_progress write own" on public.lesson_progress;
create policy "lesson_progress write own"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "lesson_progress delete own" on public.lesson_progress;
create policy "lesson_progress delete own"
  on public.lesson_progress for delete
  using (auth.uid() = user_id);
