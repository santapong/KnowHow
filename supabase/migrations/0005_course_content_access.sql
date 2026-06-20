-- =============================================================
--  KnowHow — phase-5 migration: enrollment-based content access
--  Lets enrolled learners read a *private* book when it is the
--  content of a lesson in a published course they're enrolled in.
--  Removes the earlier limitation that lesson books had to be public.
--
--  Idempotent — safe to re-run.
-- =============================================================

-- Helper: is `book` the content of a lesson in a published course
-- that `viewer` is enrolled in?
create or replace function public.book_unlocked_by_enrollment(
  book uuid,
  viewer uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    join public.modules m   on m.id = l.module_id
    join public.courses c   on c.id = m.course_id
    join public.enrollments e on e.course_id = c.id
    where l.book_id = book
      and c.is_published = true
      and e.user_id = viewer
  );
$$;

-- 1. books: broaden select to include enrollment-unlocked books -----
drop policy if exists "books select own or public" on public.books;
create policy "books select own or public"
  on public.books for select
  using (
    auth.uid() = owner_id
    or is_public = true
    or public.book_unlocked_by_enrollment(id, auth.uid())
  );

-- 2. pdfs storage: same broadening for the signed-URL read ----------
-- pdf_path is `{owner_id}/{book_id}.pdf`; match by pdf_path.
drop policy if exists "pdfs read own or public-book" on storage.objects;
create policy "pdfs read own or public-book"
  on storage.objects for select
  using (
    bucket_id = 'pdfs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.books b
        where b.pdf_path = name
          and (
            b.is_public = true
            or public.book_unlocked_by_enrollment(b.id, auth.uid())
          )
      )
    )
  );
