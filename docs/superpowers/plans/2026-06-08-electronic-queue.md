# Электронная очередь приёмной комиссии — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить онлайн-очередь приёмной комиссии: абитуриенты встают в очередь с телефона, операторы вызывают по направлениям, табло и страница абитуриента обновляются в реальном времени.

**Architecture:** Next.js (App Router) на Vercel + Supabase (Postgres + Realtime + Auth). Единый источник правды — таблица `tickets`; все экраны подписаны на неё через Supabase Realtime. Критичные операции (создание талона с дневной нумерацией, атомарный вызов следующего) реализованы как Postgres RPC-функции, чтобы исключить гонки. Чистая логика очереди вынесена в тестируемые функции.

**Tech Stack:** TypeScript, Next.js (App Router), Tailwind CSS, @supabase/supabase-js, @supabase/ssr, Supabase CLI (локальная БД), Vitest.

**Спецификация:** `docs/superpowers/specs/2026-06-08-electronic-queue-design.md`

---

## Структура файлов

```
package.json, next.config.ts, tsconfig.json, vitest.config.ts, .env.local.example
supabase/
  config.toml                         # генерируется `supabase init`
  migrations/
    0001_schema.sql                   # таблицы services, counters, tickets, operators
    0002_rls.sql                      # политики Row Level Security
    0003_functions.sql                # RPC: create_ticket, call_next, recall, finish, no_show, reset_day
  seed.sql                            # тестовые направления и окна
src/
  lib/
    queue/
      types.ts                        # общие TS-типы (Service, Counter, Ticket, ...)
      ticketNumber.ts                 # formatTicketNumber(prefix, seq)
      position.ts                     # peopleAhead(tickets, ticketId)
      waitTime.ts                     # estimateWaitMinutes(peopleAhead, avgServiceMin)
      nextWaiting.ts                  # selectNextWaiting(tickets) — зеркало логики SQL для превью
    supabase/
      client.ts                       # браузерный клиент
      server.ts                       # серверный клиент (cookies)
    db/
      queries.ts                      # обёртки над RPC и select-ами
  hooks/
    useRealtimeTickets.ts             # подписка на tickets + fallback-реконнект
  components/
    TicketCard.tsx, CallBanner.tsx, BoardRow.tsx, OperatorPanel.tsx
  app/
    layout.tsx, globals.css
    page.tsx                          # абитуриент: выбор направления
    ticket/[id]/page.tsx              # абитуриент: свой талон
    board/page.tsx                    # табло
    operator/page.tsx                 # оператор
    admin/page.tsx                    # админ
    login/page.tsx                    # вход операторов/админа
    actions.ts                        # server actions (createTicket, callNext, ...)
```

---

## Phase 0 — Каркас проекта

### Task 1: Scaffold Next.js + TypeScript + Tailwind

**Files:**
- Create: весь каркас Next.js в корне проекта

- [ ] **Step 1: Создать приложение Next.js**

Выполнить в корне `C:\Users\Arlan Alimbay\Documents\electronic queue` (папка уже содержит `docs/` и `.git` — scaffold в текущую папку):

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack --use-npm --yes
```

Если CLI откажется из-за непустой папки — создать во временной подпапке `app-tmp` и перенести содержимое в корень, затем удалить `app-tmp`.

- [ ] **Step 2: Проверить, что dev-сервер стартует**

Run: `npm run build`
Expected: сборка проходит без ошибок (есть дефолтная страница).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: каркас Next.js + TypeScript + Tailwind"
```

---

### Task 2: Подключить Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/queue/sanity.test.ts`
- Modify: `package.json` (скрипт `test`)

- [ ] **Step 1: Установить Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Создать `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Добавить скрипт в `package.json`**

В раздел `"scripts"` добавить:

```json
"test": "vitest run"
```

- [ ] **Step 4: Написать sanity-тест `src/lib/queue/sanity.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("работает", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Запустить тесты**

Run: `npm test`
Expected: PASS, 1 тест.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: настроить Vitest"
```

---

### Task 3: Зависимости Supabase и пример окружения

**Files:**
- Create: `.env.local.example`
- Modify: `package.json` (зависимости)

- [ ] **Step 1: Установить клиент Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Создать `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-anon-key
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: зависимости Supabase и пример окружения"
```

---

## Phase 1 — База данных

### Task 4: Инициализировать Supabase и миграцию схемы

**Files:**
- Create: `supabase/config.toml` (через `supabase init`)
- Create: `supabase/migrations/0001_schema.sql`

- [ ] **Step 1: Инициализировать Supabase локально**

```bash
npx supabase init
npx supabase start
```

`supabase start` поднимает локальный Postgres + Realtime в Docker и печатает `API URL`, `anon key`, `service_role key` — внести их в `.env.local`.

- [ ] **Step 2: Создать миграцию `supabase/migrations/0001_schema.sql`**

```sql
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

-- Realtime для таблицы tickets
alter publication supabase_realtime add table tickets;
```

- [ ] **Step 3: Применить миграцию**

Run: `npx supabase migration up`
Expected: миграция применяется без ошибок.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(db): схема services/counters/tickets/operators"
```

---

### Task 5: RLS-политики

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Создать `supabase/migrations/0002_rls.sql`**

```sql
alter table services enable row level security;
alter table counters enable row level security;
alter table tickets  enable row level security;
alter table operators enable row level security;

-- Хелпер: текущий пользователь — админ?
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(
    select 1 from operators o
    where o.user_id = auth.uid() and o.role = 'admin'
  );
$$;

-- services: читать всем, менять только админу
create policy "services read" on services for select using (true);
create policy "services admin write" on services for all
  using (is_admin()) with check (is_admin());

-- counters: читать всем, менять только админу
create policy "counters read" on counters for select using (true);
create policy "counters admin write" on counters for all
  using (is_admin()) with check (is_admin());

-- tickets: читать всем (для расчёта позиции и табло)
create policy "tickets read" on tickets for select using (true);
-- прямые insert/update из браузера запрещены: только через RPC (security definer)

-- operators: пользователь видит свою запись; админ — все
create policy "operators self read" on operators for select
  using (user_id = auth.uid() or is_admin());
create policy "operators admin write" on operators for all
  using (is_admin()) with check (is_admin());
```

- [ ] **Step 2: Применить и проверить**

Run: `npx supabase migration up`
Expected: применяется без ошибок.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): RLS-политики"
```

---

### Task 6: RPC-функции очереди (атомарные операции)

**Files:**
- Create: `supabase/migrations/0003_functions.sql`

Все функции — `security definer`, что позволяет им писать в `tickets` в обход прямого запрета RLS, но с собственной проверкой прав внутри.

- [ ] **Step 1: Создать `supabase/migrations/0003_functions.sql`**

```sql
-- Создать талон: дневная нумерация на уровне БД, атомарно.
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

-- Внутр. проверка: окно принадлежит текущему оператору/админу
create or replace function operator_owns_counter(p_counter_id uuid)
returns boolean language sql security definer stable as $$
  select is_admin() or exists(
    select 1 from operators o
    where o.user_id = auth.uid() and o.counter_id = p_counter_id
  );
$$;

-- Вызвать следующего: атомарно берём старейший waiting своего направления.
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
  return v_row; -- null, если очередь пуста
end;
$$;

-- Повторный вызов: не меняет позицию, увеличивает recall_count.
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

-- Завершить обслуживание.
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

-- Отметить "не явился".
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

-- Сброс дня: архивируем (переводим активные в done) и нумерация обнулится
-- естественно при смене service_day. Доступно только админу.
create or replace function reset_day()
returns void language plpgsql security definer as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  update tickets set status = 'done', finished_at = now()
  where status in ('waiting', 'called', 'serving')
    and service_day = (now() at time zone 'utc')::date;
end;
$$;
```

- [ ] **Step 2: Применить миграцию**

Run: `npx supabase migration up`
Expected: применяется без ошибок.

- [ ] **Step 3: Smoke-проверка в psql**

Run:
```bash
npx supabase db reset
```
Затем в SQL-редакторе (Studio на http://127.0.0.1:54323) выполнить:
```sql
insert into services (name, prefix) values ('Подача документов', 'A');
select create_ticket((select id from services limit 1));
```
Expected: возвращается талон с `number = 'A-001'`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(db): RPC create_ticket/call_next/recall/finish/no_show/reset_day"
```

---

### Task 7: Seed-данные для разработки

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Создать `supabase/seed.sql`**

```sql
insert into services (name, prefix) values
  ('Подача документов', 'A'),
  ('Консультация', 'B');

insert into counters (name, service_id)
select 'Окно 1', id from services where prefix = 'A';
insert into counters (name, service_id)
select 'Окно 2', id from services where prefix = 'A';
insert into counters (name, service_id)
select 'Окно 3', id from services where prefix = 'B';
```

- [ ] **Step 2: Применить через reset**

Run: `npx supabase db reset`
Expected: схема + seed применяются; в Studio видны 2 направления и 3 окна.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(db): seed-данные направлений и окон"
```

---

## Phase 2 — Чистая логика очереди (TDD)

### Task 8: Общие типы

**Files:**
- Create: `src/lib/queue/types.ts`

- [ ] **Step 1: Создать `src/lib/queue/types.ts`**

```ts
export type TicketStatus =
  | "waiting" | "called" | "serving" | "done" | "no_show";

export interface Service {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
}

export interface Counter {
  id: string;
  name: string;
  service_id: string;
  is_open: boolean;
}

export interface Ticket {
  id: string;
  service_id: string;
  seq: number;
  number: string;
  status: TicketStatus;
  counter_id: string | null;
  recall_count: number;
  service_day: string;
  created_at: string;
  called_at: string | null;
  finished_at: string | null;
}
```

- [ ] **Step 2: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(queue): общие типы"
```

---

### Task 9: Формат номера талона (TDD)

**Files:**
- Create: `src/lib/queue/ticketNumber.ts`
- Test: `src/lib/queue/ticketNumber.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
import { describe, it, expect } from "vitest";
import { formatTicketNumber } from "@/lib/queue/ticketNumber";

describe("formatTicketNumber", () => {
  it("дополняет номер нулями до трёх знаков", () => {
    expect(formatTicketNumber("A", 1)).toBe("A-001");
    expect(formatTicketNumber("B", 27)).toBe("B-027");
  });
  it("не обрезает номера больше 999", () => {
    expect(formatTicketNumber("A", 1000)).toBe("A-1000");
  });
});
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test -- ticketNumber`
Expected: FAIL (модуль не найден).

- [ ] **Step 3: Реализация `src/lib/queue/ticketNumber.ts`**

```ts
export function formatTicketNumber(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}
```

- [ ] **Step 4: Запустить — должно пройти**

Run: `npm test -- ticketNumber`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(queue): формат номера талона"
```

---

### Task 10: Расчёт «перед вами N» (TDD)

**Files:**
- Create: `src/lib/queue/position.ts`
- Test: `src/lib/queue/position.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
import { describe, it, expect } from "vitest";
import { peopleAhead } from "@/lib/queue/position";
import type { Ticket } from "@/lib/queue/types";

function t(p: Partial<Ticket>): Ticket {
  return {
    id: "x", service_id: "s", seq: 1, number: "A-001", status: "waiting",
    counter_id: null, recall_count: 0, service_day: "2026-06-08",
    created_at: "2026-06-08T10:00:00Z", called_at: null, finished_at: null,
    ...p,
  };
}

describe("peopleAhead", () => {
  it("считает только ожидающих, созданных раньше, в том же направлении", () => {
    const mine = t({ id: "me", created_at: "2026-06-08T10:05:00Z" });
    const all = [
      t({ id: "a", created_at: "2026-06-08T10:01:00Z" }),
      t({ id: "b", created_at: "2026-06-08T10:02:00Z" }),
      t({ id: "c", created_at: "2026-06-08T10:06:00Z" }), // позже — не считаем
      t({ id: "d", status: "done", created_at: "2026-06-08T10:00:00Z" }),
      mine,
    ];
    expect(peopleAhead(all, "me")).toBe(2);
  });

  it("возвращает 0, если талона нет среди ожидающих", () => {
    expect(peopleAhead([], "missing")).toBe(0);
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `npm test -- position`
Expected: FAIL.

- [ ] **Step 3: Реализация `src/lib/queue/position.ts`**

```ts
import type { Ticket } from "@/lib/queue/types";

export function peopleAhead(tickets: Ticket[], ticketId: string): number {
  const mine = tickets.find((t) => t.id === ticketId);
  if (!mine) return 0;
  return tickets.filter(
    (t) =>
      t.service_id === mine.service_id &&
      t.status === "waiting" &&
      t.created_at < mine.created_at,
  ).length;
}
```

- [ ] **Step 4: Запустить — проходит**

Run: `npm test -- position`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(queue): расчёт людей перед вами"
```

---

### Task 11: Оценка времени ожидания (TDD)

**Files:**
- Create: `src/lib/queue/waitTime.ts`
- Test: `src/lib/queue/waitTime.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
import { describe, it, expect } from "vitest";
import { estimateWaitMinutes } from "@/lib/queue/waitTime";

describe("estimateWaitMinutes", () => {
  it("умножает количество людей на среднее время обслуживания", () => {
    expect(estimateWaitMinutes(3, 5)).toBe(15);
  });
  it("ноль людей — ноль ожидания", () => {
    expect(estimateWaitMinutes(0, 5)).toBe(0);
  });
  it("использует запасное значение, если среднее неизвестно", () => {
    expect(estimateWaitMinutes(2, null)).toBe(10); // запас 5 мин
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `npm test -- waitTime`
Expected: FAIL.

- [ ] **Step 3: Реализация `src/lib/queue/waitTime.ts`**

```ts
const FALLBACK_SERVICE_MIN = 5;

export function estimateWaitMinutes(
  ahead: number,
  avgServiceMin: number | null,
): number {
  const avg = avgServiceMin && avgServiceMin > 0 ? avgServiceMin : FALLBACK_SERVICE_MIN;
  return ahead * avg;
}
```

- [ ] **Step 4: Запустить — проходит**

Run: `npm test -- waitTime`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(queue): оценка времени ожидания"
```

---

### Task 12: Выбор следующего ожидающего для превью (TDD)

**Files:**
- Create: `src/lib/queue/nextWaiting.ts`
- Test: `src/lib/queue/nextWaiting.test.ts`

Зеркалит логику SQL `call_next` для отображения оператору «кто следующий» до нажатия.

- [ ] **Step 1: Написать падающий тест**

```ts
import { describe, it, expect } from "vitest";
import { selectNextWaiting } from "@/lib/queue/nextWaiting";
import type { Ticket } from "@/lib/queue/types";

function t(p: Partial<Ticket>): Ticket {
  return {
    id: "x", service_id: "s", seq: 1, number: "A-001", status: "waiting",
    counter_id: null, recall_count: 0, service_day: "2026-06-08",
    created_at: "2026-06-08T10:00:00Z", called_at: null, finished_at: null,
    ...p,
  };
}

describe("selectNextWaiting", () => {
  it("возвращает самый ранний waiting нужного направления", () => {
    const all = [
      t({ id: "later", created_at: "2026-06-08T10:02:00Z" }),
      t({ id: "earliest", created_at: "2026-06-08T10:01:00Z" }),
      t({ id: "other", service_id: "z", created_at: "2026-06-08T10:00:00Z" }),
    ];
    expect(selectNextWaiting(all, "s")?.id).toBe("earliest");
  });

  it("возвращает null, если ожидающих нет", () => {
    expect(selectNextWaiting([], "s")).toBeNull();
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `npm test -- nextWaiting`
Expected: FAIL.

- [ ] **Step 3: Реализация `src/lib/queue/nextWaiting.ts`**

```ts
import type { Ticket } from "@/lib/queue/types";

export function selectNextWaiting(
  tickets: Ticket[],
  serviceId: string,
): Ticket | null {
  const waiting = tickets
    .filter((t) => t.service_id === serviceId && t.status === "waiting")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return waiting[0] ?? null;
}
```

- [ ] **Step 4: Запустить — проходит**

Run: `npm test -- nextWaiting`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(queue): выбор следующего ожидающего для превью"
```

---

## Phase 3 — Доступ к данным

### Task 13: Клиенты Supabase

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Браузерный клиент `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Серверный клиент `src/lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // вызвано из Server Component — игнорируем
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: браузерный и серверный клиенты Supabase"
```

---

### Task 14: Слой запросов и server actions

**Files:**
- Create: `src/lib/db/queries.ts`
- Create: `src/app/actions.ts`

- [ ] **Step 1: Создать `src/lib/db/queries.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Service, Counter, Ticket } from "@/lib/queue/types";

export async function getActiveServices(sb: SupabaseClient): Promise<Service[]> {
  const { data, error } = await sb
    .from("services").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  return data as Service[];
}

export async function getTicket(sb: SupabaseClient, id: string): Promise<Ticket | null> {
  const { data, error } = await sb.from("tickets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Ticket | null;
}

export async function getTodayTickets(
  sb: SupabaseClient, serviceId: string,
): Promise<Ticket[]> {
  const { data, error } = await sb
    .from("tickets").select("*").eq("service_id", serviceId)
    .order("created_at");
  if (error) throw error;
  return data as Ticket[];
}

export async function getCounters(sb: SupabaseClient): Promise<Counter[]> {
  const { data, error } = await sb.from("counters").select("*").order("name");
  if (error) throw error;
  return data as Counter[];
}
```

- [ ] **Step 2: Создать server actions `src/app/actions.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/lib/queue/types";

export async function createTicketAction(serviceId: string): Promise<Ticket> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("create_ticket", { p_service_id: serviceId });
  if (error) throw new Error(error.message);
  return data as Ticket;
}

export async function callNextAction(counterId: string): Promise<Ticket | null> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("call_next", { p_counter_id: counterId });
  if (error) throw new Error(error.message);
  return data as Ticket | null;
}

export async function recallAction(ticketId: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.rpc("recall_ticket", { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
}

export async function finishAction(ticketId: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.rpc("finish_ticket", { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
}

export async function noShowAction(ticketId: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.rpc("no_show_ticket", { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
}

export async function resetDayAction(): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.rpc("reset_day");
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 3: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: слой запросов и server actions для RPC"
```

---

### Task 15: Хук realtime-подписки с реконнектом

**Files:**
- Create: `src/hooks/useRealtimeTickets.ts`

- [ ] **Step 1: Создать `src/hooks/useRealtimeTickets.ts`**

```ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Ticket } from "@/lib/queue/types";

// Подписка на tickets одного направления (или всех, если serviceId не задан).
// При (ре)подключении делает полный refetch — это и есть fallback после обрыва.
export function useRealtimeTickets(serviceId?: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const refetch = useCallback(async () => {
    const sb = createClient();
    let q = sb.from("tickets").select("*").order("created_at");
    if (serviceId) q = q.eq("service_id", serviceId);
    const { data } = await q;
    if (data) setTickets(data as Ticket[]);
  }, [serviceId]);

  useEffect(() => {
    const sb = createClient();
    refetch();
    const channel = sb
      .channel(`tickets-${serviceId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => refetch(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refetch(); // fallback при реконнекте
      });
    return () => {
      sb.removeChannel(channel);
    };
  }, [serviceId, refetch]);

  return { tickets, refetch };
}
```

- [ ] **Step 2: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: хук realtime-подписки на tickets с fallback-реконнектом"
```

---

## Phase 4 — Экраны

### Task 16: Страница абитуриента — выбор направления

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Заменить `src/app/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveServices } from "@/lib/db/queries";
import { createTicketAction } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const sb = await createClient();
  const services = await getActiveServices(sb);

  async function take(formData: FormData) {
    "use server";
    const serviceId = String(formData.get("serviceId"));
    const ticket = await createTicketAction(serviceId);
    redirect(`/ticket/${ticket.id}`);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Электронная очередь</h1>
      <p className="mb-4 text-gray-600">Выберите направление:</p>
      <div className="flex flex-col gap-3">
        {services.map((s) => (
          <form action={take} key={s.id}>
            <input type="hidden" name="serviceId" value={s.id} />
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 p-5 text-lg font-semibold text-white active:bg-blue-700"
            >
              {s.name}
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Проверить вручную**

Run: `npm run dev`, открыть http://localhost:3000
Expected: видны кнопки «Подача документов» и «Консультация»; нажатие создаёт талон и редиректит на `/ticket/[id]`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui): страница выбора направления"
```

---

### Task 17: Страница талона абитуриента (realtime + звук)

**Files:**
- Create: `src/components/TicketCard.tsx`
- Create: `src/app/ticket/[id]/page.tsx`

- [ ] **Step 1: Создать клиентский компонент `src/components/TicketCard.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { peopleAhead } from "@/lib/queue/position";
import { estimateWaitMinutes } from "@/lib/queue/waitTime";
import type { Ticket, Counter } from "@/lib/queue/types";

export function TicketCard({
  ticketId, serviceId, initial, counters,
}: {
  ticketId: string;
  serviceId: string;
  initial: Ticket;
  counters: Counter[];
}) {
  const { tickets } = useRealtimeTickets(serviceId);
  const mine = tickets.find((t) => t.id === ticketId) ?? initial;
  const ahead = peopleAhead(tickets, ticketId);
  const wait = estimateWaitMinutes(ahead, null);
  const wasCalled = useRef(false);

  useEffect(() => {
    if ((mine.status === "called" || mine.status === "serving") && !wasCalled.current) {
      wasCalled.current = true;
      try {
        new AudioContext(); // разблокировка не требуется при пользовательском визите
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    if (mine.status === "waiting") wasCalled.current = false;
  }, [mine.status]);

  const counterName =
    counters.find((c) => c.id === mine.counter_id)?.name ?? "";

  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <p className="text-gray-500">Ваш номер</p>
      <p className="my-2 text-6xl font-extrabold tracking-wider">{mine.number}</p>

      {mine.status === "waiting" && (
        <>
          <p className="mt-6 text-xl">Перед вами: <b>{ahead}</b> чел.</p>
          <p className="text-gray-500">≈ {wait} мин ожидания</p>
          <p className="mt-4 text-3xl">⏳</p>
        </>
      )}
      {(mine.status === "called" || mine.status === "serving") && (
        <div className="mt-6 rounded-xl bg-green-100 p-6">
          <p className="text-2xl">🔔 Вас вызывают!</p>
          <p className="mt-2 text-3xl font-bold">{counterName}</p>
        </div>
      )}
      {mine.status === "done" && <p className="mt-6 text-2xl">✅ Завершено</p>}
      {mine.status === "no_show" && (
        <p className="mt-6 text-2xl text-red-600">Вы не подошли вовремя</p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Создать страницу `src/app/ticket/[id]/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getTicket, getCounters } from "@/lib/db/queries";
import { TicketCard } from "@/components/TicketCard";
import { notFound } from "next/navigation";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createClient();
  const ticket = await getTicket(sb, id);
  if (!ticket) notFound();
  const counters = await getCounters(sb);

  return (
    <TicketCard
      ticketId={ticket.id}
      serviceId={ticket.service_id}
      initial={ticket}
      counters={counters}
    />
  );
}
```

- [ ] **Step 3: Проверить вручную**

Run: dev-сервер запущен. Создать талон с главной страницы. В Studio выполнить `select call_next((select id from counters where name='Окно 1'));`
Expected: страница талона мгновенно меняется на «🔔 Вас вызывают! Окно 1», слышен сигнал.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): страница талона абитуриента с realtime и сигналом"
```

---

### Task 18: Табло

**Files:**
- Create: `src/components/BoardRow.tsx`
- Create: `src/app/board/page.tsx`

- [ ] **Step 1: Создать `src/components/BoardRow.tsx`**

```tsx
"use client";

import type { Ticket, Counter } from "@/lib/queue/types";

export function BoardRow({ ticket, counters, highlight }: {
  ticket: Ticket; counters: Counter[]; highlight: boolean;
}) {
  const counterName = counters.find((c) => c.id === ticket.counter_id)?.name ?? "—";
  return (
    <div
      className={`flex items-center justify-between rounded-xl p-6 text-4xl font-bold ${
        highlight ? "bg-yellow-300" : "bg-gray-100"
      }`}
    >
      <span>{ticket.number}</span>
      <span className="text-3xl">→ {counterName}</span>
    </div>
  );
}
```

- [ ] **Step 2: Создать клиентский экран табло `src/app/board/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { createClient } from "@/lib/supabase/client";
import { BoardRow } from "@/components/BoardRow";
import type { Counter } from "@/lib/queue/types";

export default function BoardPage() {
  const { tickets } = useRealtimeTickets();
  const [counters, setCounters] = useState<Counter[]>([]);

  useEffect(() => {
    createClient().from("counters").select("*").then(({ data }) => {
      if (data) setCounters(data as Counter[]);
    });
  }, []);

  const called = tickets
    .filter((t) => t.status === "called" || t.status === "serving")
    .sort((a, b) => (b.called_at ?? "").localeCompare(a.called_at ?? ""))
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-8 text-center text-5xl font-extrabold">
        Приёмная комиссия — очередь
      </h1>
      <div className="mx-auto flex max-w-3xl flex-col gap-4 text-gray-900">
        {called.map((t, i) => (
          <BoardRow key={t.id} ticket={t} counters={counters} highlight={i === 0} />
        ))}
        {called.length === 0 && (
          <p className="text-center text-3xl text-gray-400">Нет вызовов</p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Проверить вручную**

Run: открыть http://localhost:3000/board. Выполнить `call_next` в Studio.
Expected: сверху появляется подсвеченная строка «A-00x → Окно 1».

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): табло вызовов"
```

---

### Task 19: Вход операторов/админа

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Создать helper `src/lib/auth.ts`**

```ts
import { createClient } from "@/lib/supabase/server";

export interface OperatorProfile {
  user_id: string;
  role: "operator" | "admin";
  counter_id: string | null;
}

export async function getOperatorProfile(): Promise<OperatorProfile | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("operators").select("*").eq("user_id", user.id).maybeSingle();
  return (data as OperatorProfile) ?? null;
}
```

- [ ] **Step 2: Создать страницу входа `src/app/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }
    router.push("/operator");
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">Вход сотрудника</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="rounded border p-3" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="rounded border p-3" type="password" placeholder="Пароль"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-600">{error}</p>}
        <button className="rounded bg-blue-600 p-3 text-white">Войти</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Создать тестового оператора в Studio**

В Studio → Authentication → создать пользователя (email/пароль). Затем в SQL:
```sql
insert into operators (user_id, role, counter_id)
values ('<скопированный-user-id>', 'operator',
        (select id from counters where name = 'Окно 1'));
```

- [ ] **Step 4: Проверить вручную**

Run: открыть /login, войти.
Expected: редирект на /operator (страница появится в Task 20; пока может быть 404 — это нормально).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): вход сотрудников и профиль оператора"
```

---

### Task 20: Экран оператора

**Files:**
- Create: `src/components/OperatorPanel.tsx`
- Create: `src/app/operator/page.tsx`

- [ ] **Step 1: Создать клиентскую панель `src/components/OperatorPanel.tsx`**

```tsx
"use client";

import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { selectNextWaiting } from "@/lib/queue/nextWaiting";
import {
  callNextAction, recallAction, finishAction, noShowAction,
} from "@/app/actions";
import type { Counter } from "@/lib/queue/types";
import { useTransition } from "react";

export function OperatorPanel({ counter }: { counter: Counter }) {
  const { tickets } = useRealtimeTickets(counter.service_id);
  const [pending, start] = useTransition();

  const current = tickets.find(
    (t) => t.counter_id === counter.id &&
      (t.status === "called" || t.status === "serving"),
  );
  const next = selectNextWaiting(tickets, counter.service_id);
  const waitingCount = tickets.filter((t) => t.status === "waiting").length;

  const run = (fn: () => Promise<unknown>) => () => start(() => { fn(); });

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">{counter.name}</h1>
      <p className="text-gray-500">Ожидают: {waitingCount}</p>

      <div className="my-6 rounded-xl border p-6 text-center">
        <p className="text-gray-500">Сейчас обслуживается</p>
        <p className="text-5xl font-extrabold">{current?.number ?? "—"}</p>
      </div>

      <p className="mb-2 text-gray-500">
        Следующий: <b>{next?.number ?? "нет"}</b>
      </p>

      <div className="flex flex-col gap-3">
        <button disabled={pending}
          onClick={run(() => callNextAction(counter.id))}
          className="rounded-xl bg-blue-600 p-4 text-lg font-semibold text-white disabled:opacity-50">
          Вызвать следующего
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button disabled={pending || !current}
            onClick={run(() => recallAction(current!.id))}
            className="rounded-xl bg-amber-500 p-3 font-semibold text-white disabled:opacity-40">
            Повторно
          </button>
          <button disabled={pending || !current}
            onClick={run(() => finishAction(current!.id))}
            className="rounded-xl bg-green-600 p-3 font-semibold text-white disabled:opacity-40">
            Завершить
          </button>
          <button disabled={pending || !current}
            onClick={run(() => noShowAction(current!.id))}
            className="rounded-xl bg-red-600 p-3 font-semibold text-white disabled:opacity-40">
            Не явился
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Создать страницу `src/app/operator/page.tsx`**

```tsx
import { getOperatorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OperatorPanel } from "@/components/OperatorPanel";
import { redirect } from "next/navigation";
import type { Counter } from "@/lib/queue/types";

export default async function OperatorPage() {
  const profile = await getOperatorProfile();
  if (!profile) redirect("/login");
  if (!profile.counter_id) {
    return <main className="p-6">Окно не назначено. Обратитесь к админу.</main>;
  }
  const sb = await createClient();
  const { data } = await sb
    .from("counters").select("*").eq("id", profile.counter_id).single();

  return <OperatorPanel counter={data as Counter} />;
}
```

- [ ] **Step 3: Проверить вручную**

Run: войти как оператор, открыть /operator.
Expected: видно «Окно 1», число ожидающих, кнопки. «Вызвать следующего» меняет «Сейчас обслуживается» и зажигает табло + страницу абитуриента. «Повторно/Завершить/Не явился» работают.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): экран оператора"
```

---

### Task 21: Экран админа — направления, окна, статистика, сброс дня

**Files:**
- Create: `src/lib/db/stats.ts`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/AdminControls.tsx`

- [ ] **Step 1: Создать `src/lib/db/stats.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ticket } from "@/lib/queue/types";

export interface DayStats {
  served: number;
  noShow: number;
  avgWaitMin: number;
  avgServiceMin: number;
}

export async function getDayStats(sb: SupabaseClient): Promise<DayStats> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb
    .from("tickets").select("*").eq("service_day", today);
  const tickets = (data ?? []) as Ticket[];

  const served = tickets.filter((t) => t.status === "done").length;
  const noShow = tickets.filter((t) => t.status === "no_show").length;

  const avg = (xs: number[]) =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;

  const waitMin = tickets
    .filter((t) => t.called_at)
    .map((t) => (Date.parse(t.called_at!) - Date.parse(t.created_at)) / 60000);
  const serviceMin = tickets
    .filter((t) => t.called_at && t.finished_at)
    .map((t) => (Date.parse(t.finished_at!) - Date.parse(t.called_at!)) / 60000);

  return {
    served, noShow,
    avgWaitMin: avg(waitMin),
    avgServiceMin: avg(serviceMin),
  };
}
```

- [ ] **Step 2: Создать клиентские контролы `src/app/admin/AdminControls.tsx`**

```tsx
"use client";

import { resetDayAction } from "@/app/actions";
import { useTransition } from "react";

export function AdminControls() {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Сбросить день? Активные талоны будут закрыты.")) {
          start(() => { resetDayAction(); });
        }
      }}
      className="rounded-xl bg-red-600 p-3 font-semibold text-white disabled:opacity-50"
    >
      Сбросить день
    </button>
  );
}
```

- [ ] **Step 3: Создать страницу `src/app/admin/page.tsx`**

```tsx
import { getOperatorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveServices, getCounters } from "@/lib/db/queries";
import { getDayStats } from "@/lib/db/stats";
import { AdminControls } from "./AdminControls";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const profile = await getOperatorProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") {
    return <main className="p-6">Доступ только для администратора.</main>;
  }

  const sb = await createClient();
  const [services, counters, stats] = await Promise.all([
    getActiveServices(sb), getCounters(sb), getDayStats(sb),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Администрирование</h1>

      <section className="mb-8 grid grid-cols-2 gap-4">
        <Stat label="Обслужено" value={stats.served} />
        <Stat label="Не явились" value={stats.noShow} />
        <Stat label="Ср. ожидание" value={`${stats.avgWaitMin} мин`} />
        <Stat label="Ср. обслуживание" value={`${stats.avgServiceMin} мин`} />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Направления</h2>
        <ul className="list-disc pl-5">
          {services.map((s) => <li key={s.id}>{s.name} ({s.prefix})</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Окна</h2>
        <ul className="list-disc pl-5">
          {counters.map((c) => <li key={c.id}>{c.name}</li>)}
        </ul>
      </section>

      <AdminControls />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
```

- [ ] **Step 4: Назначить роль admin и проверить**

В SQL для своего пользователя: `update operators set role='admin' where user_id='<id>';`
Run: открыть /admin.
Expected: видна статистика за день, списки направлений и окон, кнопка «Сбросить день» (с подтверждением).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): экран админа со статистикой и сбросом дня"
```

---

## Phase 5 — Финал

### Task 22: README и подготовка к деплою

**Files:**
- Create: `README.md`

- [ ] **Step 1: Создать `README.md`**

````markdown
# Электронная очередь приёмной комиссии

Next.js + Supabase. Онлайн-очередь по направлениям с табло и экраном оператора.

## Локальный запуск
1. `npm install`
2. `npx supabase start` — поднимет локальный Postgres/Realtime, скопировать ключи в `.env.local` (см. `.env.local.example`).
3. `npx supabase db reset` — применит миграции и seed.
4. `npm run dev`

## Экраны
- `/` — абитуриент: выбор направления
- `/ticket/[id]` — талон абитуриента
- `/board` — табло (для ТВ в холле)
- `/login` → `/operator` — оператор
- `/admin` — администратор

## Тесты
`npm test`

## Деплой (Vercel + Supabase Cloud)
1. Создать проект в Supabase Cloud, применить миграции: `npx supabase link` + `npx supabase db push`.
2. Импортировать репозиторий в Vercel.
3. В Vercel задать env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Распечатать QR со ссылкой на корень сайта для абитуриентов.
````

- [ ] **Step 2: Финальная проверка сборки и тестов**

Run: `npm test && npm run build`
Expected: тесты PASS, сборка успешна.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: README и инструкция по деплою"
```

---

### Task 23: Ручной приёмочный сценарий перед комиссией

**Files:** нет (чек-лист)

- [ ] **Step 1: Прогнать полный цикл**

Открыть одновременно: `/board` на одном экране, `/operator` (вход Окно 1) на втором, `/` на телефоне.
1. На телефоне взять талон «Подача документов» → видна позиция «Перед вами N».
2. Оператор «Вызвать следующего» → телефон показывает «🔔 Вас вызывают! Окно 1» со звуком, табло показывает строку.
3. «Повторно» → сигнал и табло обновляются повторно.
4. «Завершить» → телефон показывает «✅ Завершено».
5. Взять ещё талон, «Не явился» → статус «не подошли вовремя».
6. Открыть второе окно того же направления, проверить отсутствие задвоения при одновременном «Вызвать».
7. В `/admin` проверить статистику и «Сбросить день».

Expected: все шаги проходят, задвоений нет.

- [ ] **Step 2: Зафиксировать готовность**

```bash
git commit --allow-empty -m "chore: пройден приёмочный сценарий"
```

---

## Self-Review (проверка плана против спецификации)

- **Покрытие спека:** формат онлайн (Task 16–17), направления→окна (Task 4, 7), 4 экрана (16/17/18/20/21), realtime + звук (15, 17), повторный вызов (6, 20), RLS (5), атомарный вызов и нумерация (6), граничные случаи — двойной вызов через `for update skip locked` (6), статистика и сброс дня (6, 21), реконнект-fallback (15). Все разделы спецификации покрыты.
- **Заглушки:** отсутствуют — в каждом шаге реальный код/команда.
- **Согласованность имён:** `create_ticket`, `call_next`, `recall_ticket`, `finish_ticket`, `no_show_ticket`, `reset_day` совпадают между SQL (Task 6) и server actions (Task 14); `peopleAhead`, `estimateWaitMinutes`, `selectNextWaiting`, `formatTicketNumber`, `useRealtimeTickets` используются согласованно.
