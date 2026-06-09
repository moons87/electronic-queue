-- ============================================================================
-- Назначение администратора.
-- ШАГ 1: Supabase → Authentication → Users → Add user →
--         укажите Email и Password (это и будет логин в админку),
--         поставьте галочку «Auto Confirm User».
-- ШАГ 2: впишите тот же email ниже и запустите этот запрос в SQL Editor.
-- ============================================================================

insert into operators (user_id, role)
select id, 'admin' from auth.users
where email = 'admin@apc.kz'        -- ← замените на ваш email из ШАГА 1
on conflict (user_id) do update set role = 'admin';

-- Проверка: должна вернуться одна строка с role = admin.
select o.role, u.email
from operators o join auth.users u on u.id = o.user_id;
