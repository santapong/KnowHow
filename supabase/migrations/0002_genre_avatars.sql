-- =============================================================
--  KnowHow v1 — phase-2 migration
--  Adds: book genres, profile handles for /u/[handle] routes,
--        avatars storage bucket. Idempotent — safe to re-run.
-- =============================================================

-- 1. Genres on books -------------------------------------------
do $$ begin
  create type public.book_genre as enum (
    'fiction', 'poetry', 'essays', 'history', 'philosophy', 'other'
  );
exception when duplicate_object then null; end $$;

alter table public.books
  add column if not exists genre public.book_genre not null default 'other';

create index if not exists books_genre_public_idx
  on public.books(genre) where is_public = true;

-- 2. Handles on profiles for stable public URLs -----------------
alter table public.profiles
  add column if not exists handle text;

create unique index if not exists profiles_handle_unique
  on public.profiles(lower(handle))
  where handle is not null;

-- Backfill a handle from email-prefix / display_name when missing.
update public.profiles
   set handle = lower(regexp_replace(coalesce(display_name, id::text), '[^a-z0-9]+', '-', 'gi'))
 where handle is null;

-- 3. Update the new-user trigger to also seed handle -------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  suffix    int := 0;
begin
  base_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  candidate := lower(regexp_replace(base_name, '[^a-z0-9]+', '-', 'gi'));
  candidate := nullif(trim(both '-' from candidate), '');
  if candidate is null then
    candidate := 'reader';
  end if;

  while exists (select 1 from public.profiles where lower(handle) = candidate) loop
    suffix := suffix + 1;
    candidate := candidate || suffix::text;
  end loop;

  insert into public.profiles (id, display_name, avatar_url, handle)
  values (
    new.id,
    base_name,
    new.raw_user_meta_data->>'avatar_url',
    candidate
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4. Avatars bucket --------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 2097152)  -- 2 MB
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
