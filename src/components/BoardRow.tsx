"use client";

import { ArrowRight } from "lucide-react";
import type { Ticket, Counter } from "@/lib/queue/types";

export function BoardRow({ ticket, counters, highlight }: {
  ticket: Ticket; counters: Counter[]; highlight: boolean;
}) {
  const counterName = counters.find((c) => c.id === ticket.counter_id)?.name ?? "—";
  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-8 py-6 transition ${
        highlight
          ? "glow bg-brass-400 text-wine-900"
          : "bg-white/10 text-paper ring-1 ring-white/10"
      }`}
    >
      <span className="tnum font-display text-5xl font-extrabold">{ticket.number}</span>
      <span className="flex items-center gap-3 text-3xl font-semibold">
        <ArrowRight className={`size-7 ${highlight ? "text-wine-800/70" : "text-paper/50"}`} aria-hidden />
        {counterName}
      </span>
    </div>
  );
}
