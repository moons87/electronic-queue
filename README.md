# Электронная очередь приёмной комиссии

Next.js 16 + Supabase. Онлайн-очередь по направлениям: абитуриенты встают в очередь с
телефона, операторы вызывают по своим окнам, табло в холле и страница абитуриента
обновляются в реальном времени.

## Экраны

| Путь | Кто | Назначение |
|------|-----|-----------|
| `/` | Абитуриент | Выбор направления, получение талона |
| `/ticket/[id]` | Абитуриент | Свой номер, позиция, сигнал при вызове |
| `/board` | Табло | Большой экран в холле (для ТВ) |
| `/login` → `/operator` | Оператор | Вызвать / Повторно / Завершить / Не явился |
| `/admin` | Админ | Статистика за день, направления, окна, сброс дня |

## Локальный запуск

Требуется Node 20+ и Docker Desktop (для локальной Supabase).

1. `npm install`
2. `npx supabase start` — поднимет локальный Postgres/Realtime/Auth. Скопировать
   `API URL`, `anon key`, `service_role key` в `.env.local` (шаблон — `.env.local.example`).
3. `npx supabase db reset` — применит миграции (`supabase/migrations/`) и seed
   (`supabase/seed.sql`: 2 направления, 3 окна).
4. `npm run dev` → http://localhost:3000

### Тестовые учётки (локально)

Создаются через Supabase Studio (http://127.0.0.1:54323) или Auth Admin API,
затем связываются строкой в таблице `operators`:

```sql
insert into operators (user_id, role, counter_id)
values ('<user-id>', 'operator', (select id from counters where name='Окно 1'));
```

Роль `admin` — то же с `role='admin'` и `counter_id` = null.

## Тесты

```
npm test
```

Покрыта чистая логика очереди: формат номера, «перед вами N», оценка ожидания, выбор
следующего ожидающего.

## Архитектура

- Единый источник правды — таблица `tickets`. Все экраны подписаны на неё через
  Supabase Realtime (`useRealtimeTickets`).
- Критичные операции — Postgres RPC-функции (`supabase/migrations/0003_functions.sql`):
  `create_ticket` (дневная нумерация), `call_next` (атомарный вызов через
  `for update skip locked`), `recall_ticket`, `finish_ticket`, `no_show_ticket`,
  `reset_day`.
- Доступ ограничен через RLS (`0002_rls.sql`): абитуриент анонимно создаёт талон и
  читает очередь; операторы меняют статусы только своего направления; админ — всё.

## Деплой (Vercel + Supabase Cloud)

1. Создать проект в Supabase Cloud.
2. `npx supabase link --project-ref <ref>` и `npx supabase db push` — применить миграции.
   Загрузить направления/окна через Studio.
3. Импортировать репозиторий в Vercel, задать переменные окружения
   `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Создать учётки операторов/админа в Supabase Auth, связать в таблице `operators`.
5. Распечатать QR-код со ссылкой на корень сайта — повесить на входе для абитуриентов.
