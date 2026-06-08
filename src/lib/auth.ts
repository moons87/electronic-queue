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
