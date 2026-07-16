-- ═══════════════════════════════════════════════════════════════
--  FazeMate — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. profiles (extends Supabase auth.users) ─────────────────
create table if not exists public.profiles (
  id       uuid primary key references auth.users(id) on delete cascade,
  name     text not null,
  email    text not null,
  role     text not null check (role in ('hr', 'candidate')) default 'candidate',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- ── Helper: get current user's role without hitting RLS ──────
-- Uses security definer so it bypasses RLS on profiles, breaking
-- the recursion that would occur if policies queried profiles directly.
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "Own profile read"  on public.profiles for select using (auth.uid() = id);
create policy "Own profile write" on public.profiles for update using (auth.uid() = id);
create policy "HR reads all"      on public.profiles for select
  using (public.get_my_role() = 'hr');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'candidate')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. candidates ─────────────────────────────────────────────
create table if not exists public.candidates (
  id           bigserial primary key,
  name         text        not null,
  email        text        not null,
  phone        text,
  position     text        not null,
  ai_score     int         not null default 0,
  experience   text,
  skills       text[]      default '{}',
  status       text        not null default 'Applied'
                           check (status in ('Applied','Screened','Interview','Offer','Hired','Approved','Rejected')),
  avatar       text,
  applied_date date        not null default current_date,
  match_reasons text[]     default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.candidates enable row level security;

create policy "HR full access"      on public.candidates for all
  using (public.get_my_role() = 'hr');

create policy "Candidate reads own" on public.candidates for select
  using (
    email = (select email from public.profiles where id = auth.uid())
  );


-- ── 3. Seed data ───────────────────────────────────────────────
insert into public.candidates
  (name, email, phone, position, ai_score, experience, skills, status, avatar, applied_date, match_reasons)
values
  ('Alexander Smith','alex.smith@email.com','+1 (555) 123-4567','Senior Frontend Developer',94,'8 years',
   ARRAY['React','TypeScript','Node.js'],'Interview','https://i.pravatar.cc/150?img=33','2024-02-20',
   ARRAY['8+ years experience','Expert in React & TypeScript','Leadership experience']),
  ('Marcus Johnson','marcus.j@email.com','+1 (555) 234-5678','Product Manager',88,'6 years',
   ARRAY['Product Strategy','Agile','Data Analysis'],'Screened','https://i.pravatar.cc/150?img=11','2024-02-19',
   ARRAY['Strong product background','Agile certification','Data-driven approach']),
  ('Steven Chen','steven.c@email.com','+1 (555) 345-6789','UX/UI Designer',92,'5 years',
   ARRAY['Figma','User Research','Prototyping'],'Offer','https://i.pravatar.cc/150?img=51','2024-02-18',
   ARRAY['Portfolio excellence','User-centered design','5+ years experience']),
  ('James Williams','james.w@email.com','+1 (555) 456-7890','Backend Developer',85,'7 years',
   ARRAY['Python','Django','PostgreSQL'],'Applied','https://i.pravatar.cc/150?img=13','2024-02-21',
   ARRAY['Strong backend skills','Database expertise','Scalable architecture']),
  ('Ethan Davis','ethan.d@email.com','+1 (555) 567-8901','Data Analyst',90,'4 years',
   ARRAY['SQL','Python','Tableau'],'Hired','https://i.pravatar.cc/150?img=52','2024-02-10',
   ARRAY['Advanced analytics','Visualization expert','Business insights']),
  ('Robert Martinez','robert.m@email.com','+1 (555) 678-9012','DevOps Engineer',87,'6 years',
   ARRAY['AWS','Docker','Kubernetes'],'Interview','https://i.pravatar.cc/150?img=14','2024-02-17',
   ARRAY['Cloud expertise','CI/CD mastery','Infrastructure automation']),
  ('Liam Anderson','liam.a@email.com','+1 (555) 789-0123','Senior Frontend Developer',78,'3 years',
   ARRAY['React','JavaScript','CSS'],'Screened','https://i.pravatar.cc/150?img=53','2024-02-22',
   ARRAY['Modern framework skills','Growing portfolio','Team player']),
  ('Daniel Brown','daniel.b@email.com','+1 (555) 890-1234','Product Manager',82,'5 years',
   ARRAY['Product Management','Roadmapping','Analytics'],'Applied','https://i.pravatar.cc/150?img=16','2024-02-23',
   ARRAY['Strategic thinking','Cross-functional lead','User focus'])
on conflict (id) do nothing;
