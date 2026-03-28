-- TeamHub Supabase Schema
-- Run this in the Supabase SQL Editor

-- Tasks table
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'set' check (status in ('set', 'doing', 'done')),
  assignee_id text not null default 'alex',
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date    date,
  created_by  text not null default 'alex',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  position    integer default 0
);

-- Messages table
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  text not null default 'general',
  user_id     text not null,
  content     text,
  file_url    text,
  file_name   text,
  file_type   text,
  is_voice    boolean default false,
  created_at  timestamptz default now()
);

-- Enable realtime
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table messages;

-- RLS policies (permissive for team use)
alter table tasks enable row level security;
alter table messages enable row level security;

create policy "Allow all on tasks" on tasks for all using (true) with check (true);
create policy "Allow all on messages" on messages for all using (true) with check (true);

-- Indexes
create index if not exists tasks_status_idx on tasks(status);
create index if not exists messages_channel_idx on messages(channel_id, created_at);

-- Seed some initial tasks
insert into tasks (title, description, status, assignee_id, priority, due_date, created_by, position) values
  ('Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment', 'done', 'jordan', 'high', current_date - 2, 'riley', 0),
  ('Design system tokens', 'Define colour, typography and spacing tokens in Figma', 'done', 'sam', 'medium', current_date - 1, 'riley', 1),
  ('Implement auth flow', 'OAuth login + JWT session management', 'doing', 'jordan', 'urgent', current_date + 1, 'jordan', 0),
  ('Build dashboard widgets', 'Stats cards and chart components', 'doing', 'alex', 'high', current_date + 2, 'riley', 1),
  ('Write API docs', 'OpenAPI spec for all endpoints', 'set', 'riley', 'medium', current_date + 5, 'jordan', 0),
  ('Mobile responsiveness', 'Ensure all pages work on mobile viewports', 'set', 'alex', 'medium', current_date + 7, 'sam', 1),
  ('Accessibility audit', 'WCAG 2.1 AA compliance check', 'set', 'sam', 'low', current_date + 10, 'riley', 2)
on conflict do nothing;
