"use client";

import { useRealtimeTickets } from "@/hooks/useRealtimeTickets";
import { selectNextWaiting } from "@/lib/queue/nextWaiting";
import {
  callNextAction, recallAction, finishAction, noShowAction,
} from "@/app/actions";
import type { Counter } from "@/lib/queue/types";
import { useTransition } from "react";

export function OperatorPanel({ counter }: { counter: Counter }) {
  const { tickets } = useRealtimeTickets(counter.service_id);
  const [pending, start] = useTransition();

  const current = tickets.find(
    (t) => t.counter_id === counter.id &&
      (t.status === "called" || t.status === "serving"),
  );
  const next = selectNextWaiting(tickets, counter.service_id);
  const waitingCount = tickets.filter((t) => t.status === "waiting").length;

  const run = (fn: () => Promise<unknown>) => () => start(() => { fn(); });

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-wine-800">
            {counter.name}
          </h1>
          <p className="text-sm text-ink-soft">Панель оператора</p>
        </div>
        <div className="text-right">
          <p className="tnum text-2xl font-bold text-ink">{waitingCount}</p>
          <p className="text-xs text-ink-soft">в ожидании</p>
        </div>
      </div>

      <div className="card my-6 rounded-3xl p-7 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
          Сейчас обслуживается
        </p>
        <p className="tnum font-display mt-1 text-6xl font-extrabold text-wine-700">
          {current?.number ?? "—"}
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Следующий: <b className="tnum text-ink">{next?.number ?? "нет"}</b>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button disabled={pending}
          onClick={run(() => callNextAction(counter.id))}
          className="btn-wine rounded-2xl p-4 text-lg font-semibold">
          Вызвать следующего
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button disabled={pending || !current}
            onClick={run(() => recallAction(current!.id))}
            className="rounded-xl border border-brass-500 bg-brass-400/15 p-3 font-semibold text-brass-600 transition hover:bg-brass-400/25 disabled:opacity-40">
            Повторно
          </button>
          <button disabled={pending || !current}
            onClick={run(() => finishAction(current!.id))}
            className="rounded-xl border border-wine-700/30 bg-wine-50 p-3 font-semibold text-wine-700 transition hover:bg-wine-100 disabled:opacity-40">
            Завершить
          </button>
          <button disabled={pending || !current}
            onClick={run(() => noShowAction(current!.id))}
            className="rounded-xl border border-line bg-white p-3 font-semibold text-ink-soft transition hover:bg-paper-2 disabled:opacity-40">
            Не явился
          </button>
        </div>
      </div>
    </main>
  );
}
