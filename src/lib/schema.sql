-- ═══════════════════════════════════════════════════════
-- TeamHub — Full Schema with Auth + Profiles
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════

-- ── 1. Profiles table (linked to auth.users) ─────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  name         text not null,
  initials     text not null default 'XX',
  avatar_color text not null default '#6c63ff',
  role         text not null default 'Team Member',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── 2. Tasks table ───────────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'set' check (status in ('set', 'doing', 'done')),
  assignee_id uuid references profiles(id) on delete set null,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date    date,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  position    integer default 0
);

-- ── 3. Messages table ────────────────────────────────────────────────────────
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  text not null default 'general',
  user_id     uuid references profiles(id) on delete set null,
  content     text,
  file_url    text,
  file_name   text,
  file_type   text,
  is_voice    boolean default false,
  created_at  timestamptz default now()
);

-- ── 4. RLS Policies ──────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table tasks    enable row level security;
alter table messages enable row level security;

-- Profiles: authenticated users can read all, update own
create policy "Profiles: read all"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Profiles: update own"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Tasks: all authenticated users can CRUD
create policy "Tasks: full access"
  on tasks for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Messages: all authenticated users can CRUD
create policy "Messages: full access"
  on messages for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ── 5. Enable realtime ───────────────────────────────────────────────────────
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table profiles;

-- ── 6. Indexes ───────────────────────────────────────────────────────────────
create index if not exists tasks_status_idx    on tasks(status);
create index if not exists tasks_assignee_idx  on tasks(assignee_id);
create index if not exists messages_channel_idx on messages(channel_id, created_at);

-- ── 7. Auto-create profile on signup (trigger) ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, initials, avatar_color, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 1) ||
          case when position(' ' in coalesce(new.raw_user_meta_data->>'name', '')) > 0
               then left(split_part(coalesce(new.raw_user_meta_data->>'name', ''), ' ', 2), 1)
               else right(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 1)
          end),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#6c63ff'),
    coalesce(new.raw_user_meta_data->>'role', 'Team Member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 8. Seed 4 team members ───────────────────────────────────────────────────
-- Fixed UUIDs used throughout the app
do $$
declare
  corey_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  david_id uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
  lenin_id uuid := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
  luke_id  uuid := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
begin

-- Create auth.users records
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values
  (corey_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'corey@livingstonetemple.com', crypt('TeamHub2024!', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Corey Turner","avatar_color":"#6c63ff","role":"Team Member"}',
   false, '', '', '', ''),

  (david_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'david@livingstonetemple.com', crypt('TeamHub2024!', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"David Onaolapo","avatar_color":"#43e97b","role":"Team Member"}',
   false, '', '', '', ''),

  (lenin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'lenin@livingstonetemple.com', crypt('TeamHub2024!', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Lenin Manirajah","avatar_color":"#f9ca24","role":"Team Member"}',
   false, '', '', '', ''),

  (luke_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'luke@livingstonetempleton.com', crypt('TeamHub2024!', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Luke Broadbent","avatar_color":"#ff6584","role":"Team Member"}',
   false, '', '', '', '')
on conflict (id) do nothing;

-- Create auth.identities
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), corey_id, 'corey@livingstonetemple.com',
   json_build_object('sub', corey_id::text, 'email', 'corey@livingstonetemple.com'),
   'email', now(), now(), now()),
  (gen_random_uuid(), david_id, 'david@livingstonetemple.com',
   json_build_object('sub', david_id::text, 'email', 'david@livingstonetemple.com'),
   'email', now(), now(), now()),
  (gen_random_uuid(), lenin_id, 'lenin@livingstonetemple.com',
   json_build_object('sub', lenin_id::text, 'email', 'lenin@livingstonetemple.com'),
   'email', now(), now(), now()),
  (gen_random_uuid(), luke_id,  'luke@livingstonetempleton.com',
   json_build_object('sub', luke_id::text, 'email', 'luke@livingstonetempleton.com'),
   'email', now(), now(), now())
on conflict do nothing;

-- Create profiles (trigger will auto-create, but upsert to ensure exact values)
insert into profiles (id, email, name, initials, avatar_color, role) values
  (corey_id, 'corey@livingstonetemple.com',   'Corey Turner',    'CT', '#6c63ff', 'Team Member'),
  (david_id, 'david@livingstonetemple.com',   'David Onaolapo',  'DO', '#43e97b', 'Team Member'),
  (lenin_id, 'lenin@livingstonetemple.com',   'Lenin Manirajah', 'LM', '#f9ca24', 'Team Member'),
  (luke_id,  'luke@livingstonetempleton.com', 'Luke Broadbent',  'LB', '#ff6584', 'Team Member')
on conflict (id) do update set
  name         = excluded.name,
  initials     = excluded.initials,
  avatar_color = excluded.avatar_color,
  role         = excluded.role;

-- Seed sample tasks using real UUIDs
insert into tasks (title, description, status, assignee_id, priority, due_date, created_by, position) values
  ('Set up CI/CD pipeline',     'Configure GitHub Actions for automated testing and deployment', 'done',  david_id, 'high',   current_date - 2, luke_id,  0),
  ('Design system tokens',       'Define colour, typography and spacing tokens in Figma',        'done',  corey_id, 'medium', current_date - 1, luke_id,  1),
  ('Implement auth flow',        'OAuth login + JWT session management',                         'doing', david_id, 'urgent', current_date + 1, david_id, 0),
  ('Build dashboard widgets',    'Stats cards and chart components',                             'doing', corey_id, 'high',   current_date + 2, luke_id,  1),
  ('Write API docs',             'OpenAPI spec for all endpoints',                               'set',   luke_id,  'medium', current_date + 5, david_id, 0),
  ('Mobile responsiveness',      'Ensure all pages work on mobile viewports',                   'set',   corey_id, 'medium', current_date + 7, corey_id, 1),
  ('Accessibility audit',        'WCAG 2.1 AA compliance check',                                'set',   lenin_id, 'low',    current_date + 10,luke_id,  2)
on conflict do nothing;

end $$;
