-- =============================================================
--  KnowHow v1 — initial schema
--  Run this in Supabase Studio SQL editor on a fresh project.
--  Idempotent — safe to re-run.
-- =============================================================

-- 1. Extensions ------------------------------------------------
create extension if not exists "uuid-ossp";

-- 2. profiles --------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by anyone" on public.profiles;
create policy "profiles are readable by anyone"
  on public.profiles for select
  using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. books -----------------------------------------------------
create table if not exists public.books (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  author      text,
  page_count  int  not null check (page_count > 0),
  spine_color text not null default '#8B4513',
  cover_path  text not null,
  pdf_path    text not null,
  size_bytes  bigint not null check (size_bytes > 0),
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists books_owner_idx on public.books(owner_id);
create index if not exists books_public_idx on public.books(is_public) where is_public = true;

alter table public.books enable row level security;

drop policy if exists "books select own or public" on public.books;
create policy "books select own or public"
  on public.books for select
  using (auth.uid() = owner_id or is_public = true);

drop policy if exists "books insert own" on public.books;
create policy "books insert own"
  on public.books for insert
  with check (auth.uid() = owner_id);

drop policy if exists "books update own" on public.books;
create policy "books update own"
  on public.books for update
  using (auth.uid() = owner_id);

drop policy if exists "books delete own" on public.books;
create policy "books delete own"
  on public.books for delete
  using (auth.uid() = owner_id);

-- 4. reading_state ---------------------------------------------
create table if not exists public.reading_state (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  book_id    uuid not null references public.books(id)    on delete cascade,
  last_page  int  not null default 0 check (last_page >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

alter table public.reading_state enable row level security;

drop policy if exists "reading_state read own" on public.reading_state;
create policy "reading_state read own"
  on public.reading_state for select
  using (auth.uid() = user_id);

drop policy if exists "reading_state write own" on public.reading_state;
create policy "reading_state write own"
  on public.reading_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "reading_state update own" on public.reading_state;
create policy "reading_state update own"
  on public.reading_state for update
  using (auth.uid() = user_id);

-- 5. Storage buckets -------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('pdfs',   'pdfs',   false, 104857600),  -- 100 MB
  ('covers', 'covers', true,  5242880)     -- 5 MB
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- Storage policies: filename pattern is `{user_id}/{book_id}.ext`
-- So storage.foldername(name)[1] is the user_id.

drop policy if exists "pdfs read own or public-book" on storage.objects;
create policy "pdfs read own or public-book"
  on storage.objects for select
  using (
    bucket_id = 'pdfs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.books b
        where b.pdf_path = name and b.is_public = true
      )
    )
  );

drop policy if exists "pdfs insert own" on storage.objects;
create policy "pdfs insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "pdfs delete own" on storage.objects;
create policy "pdfs delete own"
  on storage.objects for delete
  using (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "covers public read" on storage.objects;
create policy "covers public read"
  on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "covers insert own" on storage.objects;
create policy "covers insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "covers delete own" on storage.objects;
create policy "covers delete own"
  on storage.objects for delete
  using (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
