import { createClient } from "@/lib/supabase/server";
import { getTicket, getCounters } from "@/lib/db/queries";
import { TicketCard } from "@/components/TicketCard";
import { getLang } from "@/lib/i18n.server";
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
  const lang = await getLang();

  return (
    <TicketCard
      ticketId={ticket.id}
      serviceId={ticket.service_id}
      initial={ticket}
      counters={counters}
      lang={lang}
    />
  );
}
