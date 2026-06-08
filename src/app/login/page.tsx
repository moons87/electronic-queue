"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }

    // Маршрутизируем по роли: админ → /admin, оператор → /operator.
    const { data: profile } = await sb
      .from("operators").select("role").eq("user_id", data.user.id).maybeSingle();
    router.push(profile?.role === "admin" ? "/admin" : "/operator");
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">Вход сотрудника</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="rounded border p-3" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="rounded border p-3" type="password" placeholder="Пароль"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-600">{error}</p>}
        <button className="rounded bg-blue-600 p-3 text-white">Войти</button>
      </form>
    </main>
  );
}
