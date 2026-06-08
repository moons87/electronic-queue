"use client";

import { resetDayAction } from "@/app/actions";
import { useTransition } from "react";

export function AdminControls() {
  const [pending, start] = useTransition();
  return (
    <div className="mt-8 border-t border-line pt-6">
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Сбросить день? Активные талоны будут закрыты.")) {
            start(() => { resetDayAction(); });
          }
        }}
        className="rounded-xl border border-wine-700/30 px-4 py-2.5 text-sm font-semibold text-wine-700 transition hover:bg-wine-700 hover:text-paper disabled:opacity-50"
      >
        Сбросить день
      </button>
      <p className="mt-2 text-xs text-ink-soft">
        Закроет активные талоны и обнулит нумерацию на завтра.
      </p>
    </div>
  );
}
