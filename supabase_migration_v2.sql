-- ═══════════════════════════════════════════════════════════════
--  HireMate — Schema Migration v2
--  Run this in: Supabase Dashboard → SQL Editor → New Query
--  This adds missing columns to profiles and candidates tables.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add missing columns to profiles ──────────────────────────
alter table public.profiles
  add column if not exists phone      text    default '',
  add column if not exists location   text    default '',
  add column if not exists job_title  text    default '',
  add column if not exists bio        text    default '',
  add column if not exists avatar     text    default '';

-- ── 2. Add missing columns to candidates ────────────────────────
alter table public.candidates
  add column if not exists education      jsonb   default '[]',
  add column if not exists certifications text[]  default '{}';

-- ── 3. Allow candidates to update their OWN record ──────────────
--  (needed so resume parsing can save to candidates table)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'candidates'
      and policyname = 'Candidate updates own'
  ) then
    execute $p$
      create policy "Candidate updates own" on public.candidates for update
        using (
          email = (select email from public.profiles where id = auth.uid())
        )
    $p$;
  end if;
end $$;

-- ── 4. Allow candidate to insert their own record (first resume parse) ──
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'candidates'
      and policyname = 'Candidate inserts own'
  ) then
    execute $p$
      create policy "Candidate inserts own" on public.candidates for insert
        with check (
          email = (select email from public.profiles where id = auth.uid())
        )
    $p$;
  end if;
end $$;

-- ── 5. Allow 'admin' role option in profiles check constraint ──
do $$
declare
  r record;
begin
  for r in (
    select conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where t.relname = 'profiles' and c.contype = 'c' and c.conname like '%role%'
  ) loop
    execute 'alter table public.profiles drop constraint ' || quote_ident(r.conname);
  end loop;
end $$;

alter table public.profiles add constraint profiles_role_check check (role in ('hr', 'candidate', 'admin'));
