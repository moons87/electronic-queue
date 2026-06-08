import { createClient } from "@supabase/supabase-js";

// Сервисный клиент с полными правами. ТОЛЬКО на сервере — ключ не должен попадать
// в браузер. Использовать после проверки, что вызывающий — админ.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
