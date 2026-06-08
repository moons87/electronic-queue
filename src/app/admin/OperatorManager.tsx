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

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">Сотрудники</h2>

      <ul className="mb-4 divide-y rounded-xl border">
        {operators.map((o) => (
          <li key={o.user_id} className="flex items-center justify-between p-3">
            <span>
              {o.email} — {o.role === "admin" ? "админ" : "оператор"}
              {o.role !== "admin" && ` · ${counterName(o.counter_id)}`}
            </span>
            <button
              disabled={pending}
              onClick={() => remove(o.user_id)}
              className="text-sm text-red-600 disabled:opacity-50"
            >
              Удалить
            </button>
          </li>
        ))}
        {operators.length === 0 && (
          <li className="p-3 text-gray-400">Пока нет сотрудников</li>
        )}
      </ul>

      <div className="rounded-xl border p-4">
        <h3 className="mb-3 font-semibold">Добавить сотрудника</h3>
        <div className="flex flex-col gap-2">
          <input className="rounded border p-2" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded border p-2" type="text" placeholder="Пароль"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className="rounded border p-2" value={role}
            onChange={(e) => setRole(e.target.value as "operator" | "admin")}>
            <option value="operator">Оператор</option>
            <option value="admin">Админ</option>
          </select>
          {role === "operator" && (
            <select className="rounded border p-2" value={counterId}
              onChange={(e) => setCounterId(e.target.value)}>
              {counters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <button disabled={pending} onClick={add}
            className="rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">
            Добавить
          </button>
          {msg && <p className="text-sm text-gray-700">{msg}</p>}
        </div>
      </div>
    </section>
  );
}
