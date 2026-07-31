-- ============================================================================
-- ProjectForge AI — Initial schema
-- ----------------------------------------------------------------------------
-- Tables:   profiles, projects, artifacts, generations
-- Security: Row Level Security on every table; users only touch their own rows.
-- Extras:   updated_at triggers, auto profile creation, Storage bucket + policies.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ============================================================================
-- Helper: keep updated_at fresh on row UPDATE
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles
-- One row per auth user. id mirrors auth.users.id.
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data, 1:1 with auth.users.';

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- projects
-- ============================================================================
create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  name           text not null,
  description    text,
  status         text not null default 'draft'
                   check (status in ('draft', 'analyzing', 'ready', 'error')),
  extracted_data jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.projects.extracted_data is
  'AI-extracted, normalized analysis of all artifacts in the project.';

create index if not exists projects_user_id_idx     on public.projects (user_id);
create index if not exists projects_status_idx       on public.projects (status);
create index if not exists projects_created_at_idx   on public.projects (created_at desc);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ============================================================================
-- artifacts
-- Raw inputs a user uploads / links to a project.
-- ============================================================================
create table if not exists public.artifacts (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  type              text not null
                      check (type in ('github_repo', 'zip', 'image', 'video',
                                      'pdf', 'document', 'cad', 'other')),
  file_path         text,          -- Supabase Storage object path
  github_url        text,          -- for github_repo artifacts
  original_filename text,
  file_size_bytes   bigint,
  mime_type         text,
  metadata          jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists artifacts_project_id_idx on public.artifacts (project_id);
create index if not exists artifacts_user_id_idx     on public.artifacts (user_id);

-- ============================================================================
-- generations
-- AI-produced outputs derived from a project.
-- ============================================================================
create table if not exists public.generations (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null
                check (type in ('resume_bullets', 'star_response', 'portfolio_page',
                                'readme', 'linkedin_post', 'presentation',
                                'tech_docs', 'cover_letter', 'scholarship_app',
                                'architecture_overview')),
  content     jsonb not null,
  settings    jsonb,
  version     integer not null default 1,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists generations_project_id_idx  on public.generations (project_id);
create index if not exists generations_user_id_idx       on public.generations (user_id);
create index if not exists generations_type_idx          on public.generations (type);
create index if not exists generations_favorite_idx      on public.generations (user_id, is_favorite)
  where is_favorite = true;

-- ============================================================================
-- Auto-create a profile whenever a new auth user signs up.
-- Pulls full_name / avatar_url out of OAuth or email metadata when present.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles    enable row level security;
alter table public.projects    enable row level security;
alter table public.artifacts   enable row level security;
alter table public.generations enable row level security;

-- profiles: a user only sees / edits their own profile -----------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- projects -------------------------------------------------------------------
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- artifacts ------------------------------------------------------------------
drop policy if exists "artifacts_select_own" on public.artifacts;
create policy "artifacts_select_own" on public.artifacts
  for select using (auth.uid() = user_id);

drop policy if exists "artifacts_insert_own" on public.artifacts;
create policy "artifacts_insert_own" on public.artifacts
  for insert with check (auth.uid() = user_id);

drop policy if exists "artifacts_update_own" on public.artifacts;
create policy "artifacts_update_own" on public.artifacts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "artifacts_delete_own" on public.artifacts;
create policy "artifacts_delete_own" on public.artifacts
  for delete using (auth.uid() = user_id);

-- generations ----------------------------------------------------------------
drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own" on public.generations
  for select using (auth.uid() = user_id);

drop policy if exists "generations_insert_own" on public.generations;
create policy "generations_insert_own" on public.generations
  for insert with check (auth.uid() = user_id);

drop policy if exists "generations_update_own" on public.generations;
create policy "generations_update_own" on public.generations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "generations_delete_own" on public.generations;
create policy "generations_delete_own" on public.generations
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Storage: private "artifacts" bucket
-- Object key convention:  {user_id}/{project_id}/{filename}
-- The first path segment must equal the caller's uid.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('artifacts', 'artifacts', false, 52428800)  -- 50 MB
on conflict (id) do nothing;

drop policy if exists "artifacts_storage_select_own" on storage.objects;
create policy "artifacts_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artifacts_storage_insert_own" on storage.objects;
create policy "artifacts_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artifacts_storage_update_own" on storage.objects;
create policy "artifacts_storage_update_own" on storage.objects
  for update using (
    bucket_id = 'artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artifacts_storage_delete_own" on storage.objects;
create policy "artifacts_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'artifacts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
