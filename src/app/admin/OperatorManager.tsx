"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOperatorAction, deleteOperatorAction } from "@/app/actions";
import type { Counter } from "@/lib/queue/types";
import type { OperatorRow } from "@/lib/db/operators";

export function OperatorManager({
  operators, counters,
}: {
  operators: OperatorRow[];
  counters: Counter[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"operator" | "admin">("operator");
  const [counterId, setCounterId] = useState(counters[0]?.id ?? "");
  const [msg, setMsg] = useState("");

  const counterName = (id: string | null) =>
    counters.find((c) => c.id === id)?.name ?? "—";

  function add() {
    setMsg("");
    if (!email || !password) { setMsg("Укажите email и пароль"); return; }
    start(async () => {
      const r = await createOperatorAction({
        email, password, role,
        counterId: role === "admin" ? null : counterId,
      });
      if (r.error) { setMsg(r.error); return; }
      setEmail(""); setPassword(""); setMsg("Сотрудник добавлен");
      router.refresh();
    });
  }

  function remove(userId: string) {
    if (!confirm("Удалить сотрудника?")) return;
    start(async () => {
      const r = await deleteOperatorAction(userId);
      if (r.error) { setMsg(r.error); return; }
      router.refresh();
    });
  }

  const field =
    "rounded-xl border border-line bg-white px-3 py-2.5 outline-none transition focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20";

  return (
    <section>
      <h2 className="font-display mb-3 text-lg font-bold text-wine-800">Сотрудники</h2>

      <ul className="card mb-4 divide-y divide-line rounded-2xl">
        {operators.map((o) => (
          <li key={o.user_id} className="flex items-center justify-between gap-3 p-3.5">
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink">{o.email}</span>
              <span className="text-xs text-ink-soft">
                {o.role === "admin"
                  ? "администратор"
                  : `оператор · ${counterName(o.counter_id)}`}
              </span>
            </span>
            <button
              disabled={pending}
              onClick={() => remove(o.user_id)}
              className="shrink-0 rounded-lg px-2.5 py-1 text-sm text-wine-600 transition hover:bg-wine-50 disabled:opacity-50"
            >
              Удалить
            </button>
          </li>
        ))}
        {operators.length === 0 && (
          <li className="p-3.5 text-sm text-ink-soft">Пока нет сотрудников</li>
        )}
      </ul>

      <div className="card rounded-2xl p-5">
        <h3 className="mb-3 font-semibold text-ink">Добавить сотрудника</h3>
        <div className="flex flex-col gap-2.5">
          <input className={field} placeholder="Email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={field} type="text" placeholder="Пароль"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="grid grid-cols-2 gap-2.5">
            <select className={field} value={role}
              onChange={(e) => setRole(e.target.value as "operator" | "admin")}>
              <option value="operator">Оператор</option>
              <option value="admin">Админ</option>
            </select>
            {role === "operator" && (
              <select className={field} value={counterId}
                onChange={(e) => setCounterId(e.target.value)}>
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <button disabled={pending} onClick={add}
            className="btn-wine mt-1 rounded-xl px-4 py-2.5 font-semibold">
            Добавить
          </button>
          {msg && <p className="text-sm text-ink-soft">{msg}</p>}
        </div>
      </div>
    </section>
  );
}
