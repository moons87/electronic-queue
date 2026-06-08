import { createAdminClient } from "@/lib/supabase/admin";

export interface OperatorRow {
  user_id: string;
  email: string;
  role: "operator" | "admin";
  counter_id: string | null;
}

// Список сотрудников с их email (email лежит в auth.users — нужен сервисный клиент).
export async function getOperatorList(): Promise<OperatorRow[]> {
  const admin = createAdminClient();
  const { data: operators } = await admin
    .from("operators").select("user_id, role, counter_id");
  const { data: users } = await admin.auth.admin.listUsers();

  const emailById = new Map(users.users.map((u) => [u.id, u.email ?? ""]));
  return (operators ?? []).map((o) => ({
    user_id: o.user_id,
    email: emailById.get(o.user_id) ?? "—",
    role: o.role,
    counter_id: o.counter_id,
  }));
}
