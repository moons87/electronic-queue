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
    .filter((t) => t.finished_at && (t.served_at || t.called_at))
    .map((t) => (Date.parse(t.finished_at!) - Date.parse((t.served_at || t.called_at)!)) / 60000);

  return {
    served, noShow,
    avgWaitMin: avg(waitMin),
    avgServiceMin: avg(serviceMin),
  };
}
