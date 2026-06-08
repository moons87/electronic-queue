create extension if not exists "pgcrypto";

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefix text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table counters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_id uuid not null references services(id) on delete cascade,
  is_open boolean not null default true
);

create type ticket_status as enum ('waiting', 'called', 'serving', 'done', 'no_show');

create table tickets (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  seq integer not null,
  number text not null,
  status ticket_status not null default 'waiting',
  counter_id uuid references counters(id),
  recall_count integer not null default 0,
  service_day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  called_at timestamptz,
  finished_at timestamptz
);

create index tickets_service_status_idx on tickets (service_id, status, created_at);
create unique index tickets_service_day_seq_idx on tickets (service_id, service_day, seq);

create table operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('operator', 'admin')),
  counter_id uuid references counters(id)
);

alter publication supabase_realtime add table tickets;
