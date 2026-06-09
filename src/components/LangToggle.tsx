"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readLangCookie, type Lang } from "@/lib/i18n";

// Переключатель языка RU/KZ. Пишет cookie `lang` и обновляет страницу,
// чтобы серверные компоненты перерисовались на нужном языке.
export function LangToggle({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ru");

  useEffect(() => setLang(readLangCookie()), []);

  function choose(l: Lang) {
    document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setLang(l);
    router.refresh();
  }

  const base = "rounded-md px-2 py-1 text-xs font-bold transition";
  const activeCls = dark ? "bg-brass-400 text-wine-900" : "bg-wine-700 text-paper";
  const idleCls = dark
    ? "text-paper/60 hover:text-paper"
    : "text-ink-soft hover:text-wine-700";

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg p-0.5 ${
        dark ? "bg-white/10" : "bg-wine-50"
      }`}
      role="group"
      aria-label="Язык / Тіл"
    >
      {(["ru", "kz"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => choose(l)}
          aria-pressed={l === lang}
          className={`${base} ${l === lang ? activeCls : idleCls}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
