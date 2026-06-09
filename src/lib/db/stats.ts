import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ticket } from "@/lib/queue/types";
import { summarizeDay, type DayStats } from "@/lib/queue/dayStats";

export type { DayStats } from "@/lib/queue/dayStats";

export async function getDayStats(sb: SupabaseClient): Promise<DayStats> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb
    .from("tickets").select("*").eq("service_day", today);
  return summarizeDay((data ?? []) as Ticket[]);
}
