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

create or replace function reset_day()
returns void language plpgsql security definer as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  update tickets set status = 'done', finished_at = now()
  where status in ('waiting', 'called', 'serving')
    and service_day = (now() at time zone 'utc')::date;
end;
$$;
