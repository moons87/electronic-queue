"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { peopleAhead } from "@/lib/queue/position";
import { estimateWaitMinutes } from "@/lib/queue/waitTime";
import { leaveQueueAction } from "@/app/actions";
import type { Ticket, Counter } from "@/lib/queue/types";

export function TicketCard({
  ticketId, serviceId, initial, counters,
}: {
  ticketId: string;
  serviceId: string;
  initial: Ticket;
  counters: Counter[];
}) {
  const { tickets } = useRealtimeTickets(serviceId);
  const mine = tickets.find((t) => t.id === ticketId) ?? initial;
  const ahead = peopleAhead(tickets, ticketId);
  const wait = estimateWaitMinutes(ahead, null);
  const wasCalled = useRef(false);
  const [leaving, startLeave] = useTransition();

  // Сохраняем талон, чтобы вернуться после закрытия вкладки.
  useEffect(() => {
    try {
      localStorage.setItem("lastTicketId", ticketId);
    } catch {}
  }, [ticketId]);

  useEffect(() => {
    if ((mine.status === "called" || mine.status === "serving") && !wasCalled.current) {
      wasCalled.current = true;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    if (mine.status === "waiting") wasCalled.current = false;
  }, [mine.status]);

  const counterName =
    counters.find((c) => c.id === mine.counter_id)?.name ?? "";

  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <p className="text-gray-500">Ваш номер</p>
      <p className="my-2 text-6xl font-extrabold tracking-wider">{mine.number}</p>

      {mine.status === "waiting" && (
        <>
          <p className="mt-6 text-xl">Перед вами: <b>{ahead}</b> чел.</p>
          <p className="text-gray-500">≈ {wait} мин ожидания</p>
          <p className="mt-4 text-3xl">⏳</p>
          <button
            disabled={leaving}
            onClick={() => {
              if (confirm("Покинуть очередь?")) {
                startLeave(() => {
                  leaveQueueAction(ticketId);
                });
              }
            }}
            className="mt-8 rounded-xl border border-red-300 p-3 text-red-600 disabled:opacity-50"
          >
            Покинуть очередь
          </button>
        </>
      )}
      {(mine.status === "called" || mine.status === "serving") && (
        <div className="mt-6 rounded-xl bg-green-100 p-6">
          <p className="text-2xl">🔔 Вас вызывают!</p>
          <p className="mt-2 text-3xl font-bold">{counterName}</p>
        </div>
      )}
      {mine.status === "done" && <p className="mt-6 text-2xl">✅ Завершено</p>}
      {mine.status === "no_show" && (
        <p className="mt-6 text-2xl text-red-600">Вы не подошли вовремя</p>
      )}
      {mine.status === "cancelled" && (
        <p className="mt-6 text-2xl text-gray-500">Вы покинули очередь</p>
      )}
    </main>
  );
}
