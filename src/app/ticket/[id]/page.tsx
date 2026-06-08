import { createClient } from "@/lib/supabase/server";
import { getTicket, getCounters } from "@/lib/db/queries";
import { TicketCard } from "@/components/TicketCard";
import { notFound } from "next/navigation";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createClient();
  const ticket = await getTicket(sb, id);
  if (!ticket) notFound();
  const counters = await getCounters(sb);

  return (
    <TicketCard
      ticketId={ticket.id}
      serviceId={ticket.service_id}
      initial={ticket}
      counters={counters}
    />
  );
}
