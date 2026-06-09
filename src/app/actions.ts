"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOperatorProfile } from "@/lib/auth";
import type { Ticket } from "@/lib/queue/types";

async function assertAdmin(): Promise<void> {
  const profile = await getOperatorProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

// Создать сотрудника и привязать к окну. Только для админа.
export async function createOperatorAction(input: {
  email: string;
  password: string;
  role: "operator" | "admin";
  counterId: string | null;
}): Promise<{ error?: string }> {
  await assertAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error) return { error: error.message };

  const { error: insErr } = await admin.from("operators").insert({
    user_id: data.user.id,
    role: input.role,
    counter_id: input.role === "admin" ? null : input.counterId,
  });
  if (insErr) return { error: insErr.message };
  return {};
}

// Удалить сотрудника (каскадом удалит и строку operators). Только для админа.
export async function deleteOperatorAction(userId: string): Promise<{ error?: string }> {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return {};
}

export async function createTicketAction(serviceId: string): Promise<Ticket> {
  const sb = await createClient();

  // Идентификатор устройства в httpOnly-cookie: ограничивает 1 активный талон
  // на направление и не даёт случайно/намеренно наспамить очередь.
  const jar = await cookies();
  let device = jar.get("qid")?.value;
  if (!device) {
    device = crypto.randomUUID();
    jar.set("qid", device, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const { data, error } = await sb.rpc("create_ticket", {
    p_service_id: serviceId,
    p_device_id: device,
  });
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

export async function startServingAction(ticketId: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.rpc("start_serving", { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
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
