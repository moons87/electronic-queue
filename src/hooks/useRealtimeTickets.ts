"use client";

import { useEffect, useState, useCallback } from "react";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Ticket } from "@/lib/queue/types";

export function useRealtimeTickets(serviceId?: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const refetch = useCallback(async () => {
    const sb = createAnonClient();
    const base = sb.from("tickets").select("*").order("created_at");
    const q = serviceId ? base.eq("service_id", serviceId) : base;
    const { data } = await q;
    if (data) setTickets(data as Ticket[]);
  }, [serviceId]);

  useEffect(() => {
    const sb = createAnonClient();
    refetch();
    const channel = sb
      .channel(`tickets-${serviceId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => refetch(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refetch();
      });
    return () => {
      sb.removeChannel(channel);
    };
  }, [serviceId, refetch]);

  return { tickets, refetch };
}
