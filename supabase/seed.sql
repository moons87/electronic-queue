insert into services (name, prefix) values
  ('Подача документов', 'A'),
  ('Консультация', 'B');

insert into counters (name, service_id)
select 'Окно 1', id from services where prefix = 'A';
insert into counters (name, service_id)
select 'Окно 2', id from services where prefix = 'A';
insert into counters (name, service_id)
select 'Окно 3', id from services where prefix = 'B';
