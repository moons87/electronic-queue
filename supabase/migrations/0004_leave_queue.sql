-- Самостоятельный выход абитуриента из очереди.
-- Анониму прямой UPDATE запрещён RLS, поэтому используем security definer.
alter type ticket_status add value if not exists 'cancelled';

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
