import { createClient } from "@supabase/supabase-js";

// Анонимный клиент БЕЗ сессии — для публичного чтения (табло, страница талона).
// Намеренно не использует и не хранит вход сотрудника: протухшая сессия в
// браузере не должна ломать анонимный доступ (иначе запросы получают 401).
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
