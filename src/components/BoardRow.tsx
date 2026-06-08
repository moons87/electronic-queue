"use client";

import type { Ticket, Counter } from "@/lib/queue/types";

export function BoardRow({ ticket, counters, highlight }: {
  ticket: Ticket; counters: Counter[]; highlight: boolean;
}) {
  const counterName = counters.find((c) => c.id === ticket.counter_id)?.name ?? "—";
  return (
    <div
      className={`flex items-center justify-between rounded-xl p-6 text-4xl font-bold ${
        highlight ? "bg-yellow-300" : "bg-gray-100"
      }`}
    >
      <span>{ticket.number}</span>
      <span className="text-3xl">→ {counterName}</span>
    </div>
  );
}
