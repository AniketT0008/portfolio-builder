-- ============================================================================
-- Import Hub + Code Studio
-- Adds profile integration fields, project source tracking, code studio sessions.
-- ============================================================================

-- Profile integration links ---------------------------------------------------
alter table public.profiles
  add column if not exists github_username text,
  add column if not exists linkedin_url text;

comment on column public.profiles.github_username is
  'Public GitHub username for auto-importing repositories.';
comment on column public.profiles.linkedin_url is
  'LinkedIn profile URL for resume import context.';

-- Project source tracking -----------------------------------------------------
alter table public.projects
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'github_import', 'linkedin_import', 'custom')),
  add column if not exists source_url text;

comment on column public.projects.source is
  'How this project was created (manual, github_import, linkedin_import, custom).';

-- Code Studio sessions --------------------------------------------------------
create table if not exists public.code_studio_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  project_id        uuid references public.projects (id) on delete set null,
  name              text not null default 'Untitled project',
  status            text not null default 'uploaded'
                      check (status in ('uploaded', 'analyzing', 'refactored', 'published', 'error')),
  source_files      jsonb not null default '[]'::jsonb,
  refactored_files  jsonb,
  readme_content    text,
  linkedin_post     text,
  github_repo_url   text,
  github_push_result jsonb,
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists code_studio_sessions_user_id_idx
  on public.code_studio_sessions (user_id);
create index if not exists code_studio_sessions_created_at_idx
  on public.code_studio_sessions (created_at desc);

drop trigger if exists trg_code_studio_sessions_updated_at on public.code_studio_sessions;
create trigger trg_code_studio_sessions_updated_at
  before update on public.code_studio_sessions
  for each row execute function public.set_updated_at();

-- Sync github_username from GitHub OAuth on sign-in ---------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, github_username)
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
    ),
    nullif(new.raw_user_meta_data ->> 'user_name', '')
  )
  on conflict (id) do update set
    github_username = coalesce(
      public.profiles.github_username,
      excluded.github_username
    );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

-- RLS for code_studio_sessions -----------------------------------------------
alter table public.code_studio_sessions enable row level security;

drop policy if exists "code_studio_select_own" on public.code_studio_sessions;
create policy "code_studio_select_own" on public.code_studio_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "code_studio_insert_own" on public.code_studio_sessions;
create policy "code_studio_insert_own" on public.code_studio_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "code_studio_update_own" on public.code_studio_sessions;
create policy "code_studio_update_own" on public.code_studio_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "code_studio_delete_own" on public.code_studio_sessions;
create policy "code_studio_delete_own" on public.code_studio_sessions
  for delete using (auth.uid() = user_id);
