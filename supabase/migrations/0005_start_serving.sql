-- Шаг «Начать обслуживание»: called → serving. Отдельная отметка времени,
-- чтобы среднее время приёма считалось от начала обслуживания, а не от вызова.
alter table tickets add column if not exists served_at timestamptz;

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
