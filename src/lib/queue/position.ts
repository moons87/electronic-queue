import type { Ticket } from "@/lib/queue/types";

export function peopleAhead(tickets: Ticket[], ticketId: string): number {
  const mine = tickets.find((t) => t.id === ticketId);
  if (!mine) return 0;
  return tickets.filter(
    (t) =>
      t.service_id === mine.service_id &&
      t.status === "waiting" &&
      t.created_at < mine.created_at,
  ).length;
}
