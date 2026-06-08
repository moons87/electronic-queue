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
