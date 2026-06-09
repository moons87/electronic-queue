-- ============================================================================
-- ЭЛЕКТРОННАЯ ОЧЕРЕДЬ — полный деплой базы в Supabase Cloud.
-- Вставьте весь этот файл в Supabase → SQL Editor → New query → Run.
-- Это объединённые миграции 0001–0005 + начальные данные (направления и окна).
-- Безопасно запускать на чистом проекте. Повторный запуск выдаст ошибки
-- «already exists» — это нормально, значит схема уже создана.
-- ============================================================================

-- ---- 0001: схема ----------------------------------------------------------
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

-- ---- 0004: значение enum 'cancelled' (раньше функций, что его используют) --
alter type ticket_status add value if not exists 'cancelled';

-- ---- 0005: колонка served_at ----------------------------------------------
alter table tickets add column if not exists served_at timestamptz;

-- ---- 0002: RLS + is_admin() -----------------------------------------------
alter table services enable row level security;
alter table counters enable row level security;
alter table tickets  enable row level security;
alter table operators enable row level security;

create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(
    select 1 from operators o
    where o.user_id = auth.uid() and o.role = 'admin'
  );
$$;

create policy "services read" on services for select using (true);
create policy "services admin write" on services for all
  using (is_admin()) with check (is_admin());

create policy "counters read" on counters for select using (true);
create policy "counters admin write" on counters for all
  using (is_admin()) with check (is_admin());

create policy "tickets read" on tickets for select using (true);

create policy "operators self read" on operators for select
  using (user_id = auth.uid() or is_admin());
create policy "operators admin write" on operators for all
  using (is_admin()) with check (is_admin());

-- ---- 0003 + 0004 + 0005: RPC-функции --------------------------------------
create or replace function create_ticket(p_service_id uuid)
returns tickets language plpgsql security definer as $$
declare
  v_prefix text;
  v_day date := (now() at time zone 'utc')::date;
  v_seq integer;
  v_row tickets;
begin
  select prefix into v_prefix from services
    where id = p_service_id and is_active = true;
  if v_prefix is null then
    raise exception 'service not found or inactive';
  end if;

  select coalesce(max(seq), 0) + 1 into v_seq
    from tickets where service_id = p_service_id and service_day = v_day;

  insert into tickets (service_id, seq, number, service_day)
  values (p_service_id, v_seq,
          v_prefix || '-' || lpad(v_seq::text, 3, '0'), v_day)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function operator_owns_counter(p_counter_id uuid)
returns boolean language sql security definer stable as $$
  select is_admin() or exists(
    select 1 from operators o
    where o.user_id = auth.uid() and o.counter_id = p_counter_id
  );
$$;

create or replace function call_next(p_counter_id uuid)
returns tickets language plpgsql security definer as $$
declare
  v_service_id uuid;
  v_row tickets;
begin
  if not operator_owns_counter(p_counter_id) then
    raise exception 'forbidden';
  end if;
  select service_id into v_service_id from counters where id = p_counter_id;

  update tickets set status = 'called', counter_id = p_counter_id,
         called_at = now()
  where id = (
    select id from tickets
    where service_id = v_service_id and status = 'waiting'
    order by created_at
    for update skip locked
    limit 1
  )
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function recall_ticket(p_ticket_id uuid)
returns tickets language plpgsql security definer as $$
declare v_row tickets;
begin
  update tickets set recall_count = recall_count + 1, called_at = now()
  where id = p_ticket_id and status in ('called', 'serving')
    and operator_owns_counter(counter_id)
  returning * into v_row;
  if v_row.id is null then raise exception 'cannot recall'; end if;
  return v_row;
end;
$$;

create or replace function start_serving(p_ticket_id uuid)
returns tickets language plpgsql security definer as $$
declare v_row tickets;
begin
  update tickets set status = 'serving', served_at = now()
  where id = p_ticket_id and status = 'called'
    and operator_owns_counter(counter_id)
  returning * into v_row;
  if v_row.id is null then raise exception 'cannot start serving'; end if;
  return v_row;
end;
$$;

create or replace function finish_ticket(p_ticket_id uuid)
returns tickets language plpgsql security definer as $$
declare v_row tickets;
begin
  update tickets set status = 'done', finished_at = now()
  where id = p_ticket_id and operator_owns_counter(counter_id)
  returning * into v_row;
  if v_row.id is null then raise exception 'forbidden'; end if;
  return v_row;
end;
$$;

create or replace function no_show_ticket(p_ticket_id uuid)
returns tickets language plpgsql security definer as $$
declare v_row tickets;
begin
  update tickets set status = 'no_show', finished_at = now()
  where id = p_ticket_id and operator_owns_counter(counter_id)
  returning * into v_row;
  if v_row.id is null then raise exception 'forbidden'; end if;
  return v_row;
end;
$$;

create or replace function leave_queue(p_ticket_id uuid)
returns tickets language plpgsql security definer as $$
declare v_row tickets;
begin
  update tickets set status = 'cancelled', finished_at = now()
  where id = p_ticket_id and status = 'waiting'
  returning * into v_row;
  if v_row.id is null then raise exception 'cannot leave'; end if;
  return v_row;
end;
$$;

create or replace function reset_day()
returns void language plpgsql security definer as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  update tickets set status = 'done', finished_at = now()
  where status in ('waiting', 'called', 'serving')
    and service_day = (now() at time zone 'utc')::date;
end;
$$;

-- ---- Начальные данные: направления и окна ---------------------------------
insert into services (name, prefix) values
  ('Подача документов', 'A'),
  ('Консультация', 'B');

insert into counters (name, service_id)
select 'Окно 1', id from services where prefix = 'A';
insert into counters (name, service_id)
select 'Окно 2', id from services where prefix = 'A';
insert into counters (name, service_id)
select 'Окно 3', id from services where prefix = 'B';
