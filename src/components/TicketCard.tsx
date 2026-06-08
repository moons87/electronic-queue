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
  const called = mine.status === "called" || mine.status === "serving";

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <div className="card rise overflow-hidden rounded-3xl text-center">
        <div className="bg-wine-700 px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/80">
            Ваш талон
          </p>
        </div>

        <div className="px-6 py-8">
          <p
            className={`tnum font-display text-7xl font-extrabold ${
              called ? "text-wine-700" : "text-ink"
            }`}
          >
            {mine.number}
          </p>

          {mine.status === "waiting" && (
            <>
              <div className="mt-6 flex items-stretch justify-center gap-3">
                <div className="card rounded-2xl px-5 py-4">
                  <p className="tnum text-3xl font-bold text-ink">{ahead}</p>
                  <p className="text-xs text-ink-soft">перед вами</p>
                </div>
                <div className="card rounded-2xl px-5 py-4">
                  <p className="tnum text-3xl font-bold text-ink">≈{wait}</p>
                  <p className="text-xs text-ink-soft">минут ожидания</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-ink-soft">
                Держите страницу открытой — мы подадим сигнал, когда подойдёт очередь.
              </p>
              <button
                disabled={leaving}
                onClick={() => {
                  if (confirm("Покинуть очередь?")) {
                    startLeave(() => {
                      leaveQueueAction(ticketId);
                    });
                  }
                }}
                className="mt-6 rounded-xl border border-wine-700/25 px-4 py-2 text-sm font-semibold text-wine-700 transition hover:bg-wine-50 disabled:opacity-50"
              >
                Покинуть очередь
              </button>
            </>
          )}

          {called && (
            <div className="glow mt-6 rounded-2xl border border-brass-400 bg-brass-400/15 p-6">
              <p className="text-lg font-semibold text-wine-800">🔔 Вас вызывают</p>
              <p className="font-display mt-1 text-4xl font-bold text-wine-700">
                {counterName}
              </p>
              <p className="mt-2 text-sm text-ink-soft">Подойдите, пожалуйста</p>
            </div>
          )}

          {mine.status === "done" && (
            <p className="mt-6 text-xl font-semibold text-wine-700">
              ✓ Обслуживание завершено
            </p>
          )}
          {mine.status === "no_show" && (
            <p className="mt-6 text-lg font-semibold text-wine-600">
              Вызов пропущен — подойдите к стойке информации
            </p>
          )}
          {mine.status === "cancelled" && (
            <p className="mt-6 text-lg text-ink-soft">Вы покинули очередь</p>
          )}
        </div>
      </div>
    </main>
  );
}
