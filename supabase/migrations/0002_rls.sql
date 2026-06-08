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
