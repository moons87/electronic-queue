"use client";

import { useEffect, useState } from "react";
import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { createClient } from "@/lib/supabase/client";
import { BoardRow } from "@/components/BoardRow";
import { brand } from "@/lib/brand";
import { Logo } from "@/components/Logo";
import type { Counter, Service } from "@/lib/queue/types";

export default function BoardPage() {
  const { tickets } = useRealtimeTickets();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const sb = createClient();
    sb.from("counters").select("*").then(({ data }) => {
      if (data) setCounters(data as Counter[]);
    });
    sb.from("services").select("*").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setServices(data as Service[]); });
  }, []);

  const called = tickets
    .filter((t) => t.status === "called" || t.status === "serving")
    .sort((a, b) => (b.called_at ?? "").localeCompare(a.called_at ?? ""))
    .slice(0, 6);

  const waitingByService = (serviceId: string) =>
    tickets
      .filter((t) => t.service_id === serviceId && t.status === "waiting")
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <main
      className="min-h-screen px-10 py-8 text-paper"
      style={{
        background:
          "radial-gradient(1100px 600px at 50% -200px, #6f1d2e, transparent 70%), #3d0e1b",
      }}
    >
      <header className="mb-7 flex items-center justify-center gap-4">
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

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Вызывают */}
        <section>
          <h2 className="mb-4 text-center text-sm uppercase tracking-[0.3em] text-brass-400 lg:text-left">
            Приглашаем к окну
          </h2>
          <div className="flex flex-col gap-4">
            {called.map((t, i) => (
              <BoardRow key={t.id} ticket={t} counters={counters} highlight={i === 0} />
            ))}
            {called.length === 0 && (
              <p className="rounded-2xl bg-white/5 py-10 text-center text-2xl text-paper/40">
                Ожидание вызовов…
              </p>
            )}
          </div>
        </section>

        {/* В очереди */}
        <section>
          <h2 className="mb-4 text-center text-sm uppercase tracking-[0.3em] text-brass-400 lg:text-left">
            В очереди
          </h2>
          <div className="flex flex-col gap-4">
            {services.map((s) => {
              const waiting = waitingByService(s.id);
              return (
                <div key={s.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="mb-2 text-sm font-semibold text-paper/70">{s.name}</p>
                  {waiting.length === 0 ? (
                    <p className="text-paper/30">— нет ожидающих</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {waiting.slice(0, 12).map((t, i) => (
                        <span
                          key={t.id}
                          className={`tnum rounded-lg px-3 py-1.5 text-xl font-bold ${
                            i === 0
                              ? "bg-brass-400/25 text-brass-400 ring-1 ring-brass-400/40"
                              : "bg-white/10 text-paper/80"
                          }`}
                        >
                          {t.number}
                        </span>
                      ))}
                      {waiting.length > 12 && (
                        <span className="px-2 py-1.5 text-paper/40">
                          +{waiting.length - 12}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {services.length === 0 && (
              <p className="text-paper/30">Нет направлений</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
