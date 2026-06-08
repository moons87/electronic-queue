"use client";

import { useEffect, useState } from "react";
import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { createClient } from "@/lib/supabase/client";
import { BoardRow } from "@/components/BoardRow";
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
    <main className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-8 text-center text-5xl font-extrabold">
        Приёмная комиссия — очередь
      </h1>
      <div className="mx-auto flex max-w-3xl flex-col gap-4 text-gray-900">
        {called.map((t, i) => (
          <BoardRow key={t.id} ticket={t} counters={counters} highlight={i === 0} />
        ))}
        {called.length === 0 && (
          <p className="text-center text-3xl text-gray-400">Нет вызовов</p>
        )}
      </div>
    </main>
  );
}
