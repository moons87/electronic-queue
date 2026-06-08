"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";
import { Logo } from "@/components/Logo";

// Шапка сайта. Скрыта на табло (/board) — там нужен весь экран.
export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/board")) return null;

  const onStaff =
    pathname.startsWith("/operator") || pathname.startsWith("/admin");

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

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/board"
            className="hidden rounded-lg px-3 py-2 text-ink-soft transition hover:bg-wine-50 hover:text-wine-700 sm:block"
          >
            Табло
          </Link>
          {onStaff ? (
            <>
              <Link
                href="/operator"
                className="rounded-lg px-3 py-2 text-ink-soft transition hover:bg-wine-50 hover:text-wine-700"
              >
                Оператор
              </Link>
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-ink-soft transition hover:bg-wine-50 hover:text-wine-700"
              >
                Админ
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-wine-700/30 px-4 py-2 font-semibold text-wine-700 transition hover:bg-wine-700 hover:text-paper"
            >
              Вход для сотрудников
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
