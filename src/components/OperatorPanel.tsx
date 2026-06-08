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
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">{counter.name}</h1>
      <p className="text-gray-500">Ожидают: {waitingCount}</p>

      <div className="my-6 rounded-xl border p-6 text-center">
        <p className="text-gray-500">Сейчас обслуживается</p>
        <p className="text-5xl font-extrabold">{current?.number ?? "—"}</p>
      </div>

      <p className="mb-2 text-gray-500">
        Следующий: <b>{next?.number ?? "нет"}</b>
      </p>

      <div className="flex flex-col gap-3">
        <button disabled={pending}
          onClick={run(() => callNextAction(counter.id))}
          className="rounded-xl bg-blue-600 p-4 text-lg font-semibold text-white disabled:opacity-50">
          Вызвать следующего
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button disabled={pending || !current}
            onClick={run(() => recallAction(current!.id))}
            className="rounded-xl bg-amber-500 p-3 font-semibold text-white disabled:opacity-40">
            Повторно
          </button>
          <button disabled={pending || !current}
            onClick={run(() => finishAction(current!.id))}
            className="rounded-xl bg-green-600 p-3 font-semibold text-white disabled:opacity-40">
            Завершить
          </button>
          <button disabled={pending || !current}
            onClick={run(() => noShowAction(current!.id))}
            className="rounded-xl bg-red-600 p-3 font-semibold text-white disabled:opacity-40">
            Не явился
          </button>
        </div>
      </div>
    </main>
  );
}
