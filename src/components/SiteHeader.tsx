"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { brand } from "@/lib/brand";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

type Role = "operator" | "admin" | null;

// Шапка сайта. Знает, вошёл ли сотрудник: показывает ссылку на его панель и
// «Выйти», либо «Вход для сотрудников». Скрыта на табло (/board).
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = createClient();

    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setRole(null); setReady(true); return; }
      const { data } = await sb
        .from("operators").select("role").eq("user_id", user.id).maybeSingle();
      setRole((data?.role as Role) ?? null);
      setReady(true);
    }

    load();
    const { data: sub } = sb.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  if (pathname.startsWith("/board")) return null;

  async function signOut() {
    await createClient().auth.signOut();
    setRole(null);
    router.push("/");
    router.refresh();
  }

  // Навигация — только на страницах сотрудников. На экране абитуриента шапка
  // чистая: лого + название, без «Табло» и «Вход для сотрудников».
  const isStaff =
    pathname.startsWith("/operator") || pathname.startsWith("/admin");

  const panel = role === "admin"
    ? { href: "/admin", label: "Админ" }
    : { href: "/operator", label: "Оператор" };

  const navLink =
    "rounded-lg px-3 py-2 text-ink-soft transition hover:bg-wine-50 hover:text-wine-700";

  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={40} />
          <span className="leading-tight">
            <span className="font-display block text-lg font-bold text-wine-800">
              {brand.fullName}
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Приёмная комиссия
            </span>
          </span>
        </Link>

        {isStaff && ready && role && (
          <nav className="flex items-center gap-1 text-sm">
            <Link href={panel.href} className={navLink}>
              {panel.label}
            </Link>
            <Link href="/board" className={`hidden sm:block ${navLink}`}>
              Табло
            </Link>
            <button
              onClick={signOut}
              className="rounded-lg border border-wine-700/30 px-4 py-2 font-semibold text-wine-700 transition hover:bg-wine-700 hover:text-paper"
            >
              Выйти
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
