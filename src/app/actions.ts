"use server";

import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/lib/queue/types";

export async function createTicketAction(serviceId: string): Promise<Ticket> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("create_ticket", { p_service_id: serviceId });
  if (error) throw new Error(error.message);
  return data as Ticket;
}

export async function leaveQueueAction(ticketId: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.rpc("leave_queue", { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
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
