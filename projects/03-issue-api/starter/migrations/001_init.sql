create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100)
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 160),
  status text not null default 'open' check (status in ('open', 'closed')),
  assignee_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  actor_id uuid not null references users(id),
  action text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index issues_feed_idx on issues (created_at desc, id desc);
