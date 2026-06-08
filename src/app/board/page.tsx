"use client";

import { useEffect, useState } from "react";
import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { createClient } from "@/lib/supabase/client";
import { BoardRow } from "@/components/BoardRow";
import { brand } from "@/lib/brand";
import { Logo } from "@/components/Logo";
import type { Counter } from "@/lib/queue/types";

export default function BoardPage() {
  const { tickets } = useRealtimeTickets();
  const [counters, setCounters] = useState<Counter[]>([]);

  useEffect(() => {
    createClient().from("counters").select("*").then(({ data }) => {
      if (data) setCounters(data as Counter[]);
    });
  }, []);

  const called = tickets
    .filter((t) => t.status === "called" || t.status === "serving")
    .sort((a, b) => (b.called_at ?? "").localeCompare(a.called_at ?? ""))
    .slice(0, 8);

  return (
    <main
      className="min-h-screen px-10 py-8 text-paper"
      style={{
        background:
          "radial-gradient(1100px 600px at 50% -200px, #6f1d2e, transparent 70%), #3d0e1b",
      }}
    >
      <header className="mb-8 flex items-center justify-center gap-4">
        <Logo size={64} chip />
        <div className="text-center">
          <h1 className="font-display text-5xl font-extrabold tracking-tight">
            {brand.fullName}
          </h1>
          <p className="text-sm uppercase tracking-[0.3em] text-brass-400">
            Приёмная комиссия · очередь
          </p>
        </div>
      </header>

      <div className="rule-brass mx-auto mb-8 w-2/3" />

      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {called.map((t, i) => (
          <BoardRow key={t.id} ticket={t} counters={counters} highlight={i === 0} />
        ))}
        {called.length === 0 && (
          <p className="text-center text-3xl text-paper/40">Ожидание вызовов…</p>
        )}
      </div>
    </main>
  );
}
