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
