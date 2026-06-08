"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

async function routeByRole(
  sb: ReturnType<typeof createClient>,
  userId: string,
  router: ReturnType<typeof useRouter>,
) {
  const { data: profile } = await sb
    .from("operators").select("role").eq("user_id", userId).maybeSingle();
  router.push(profile?.role === "admin" ? "/admin" : "/operator");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setError("Неверный email или пароль"); setBusy(false); return; }

    // Маршрутизируем по роли: админ → /admin, оператор → /operator.
    await routeByRole(sb, data.user.id, router);
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-12">
      <div className="card rise rounded-3xl p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="font-display mt-4 text-2xl font-bold text-wine-800">
            Вход для сотрудников
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Операторы и администраторы приёмной комиссии
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className="rounded-xl border border-line bg-white px-4 py-3 outline-none transition focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20"
            placeholder="Email" type="email" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="rounded-xl border border-line bg-white px-4 py-3 outline-none transition focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20"
            type="password" placeholder="Пароль" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-wine-600">{error}</p>}
          <button disabled={busy}
            className="btn-wine mt-1 rounded-xl px-4 py-3 font-semibold">
            {busy ? "Вход…" : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}
