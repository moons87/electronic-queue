"use client";

import { resetDayAction } from "@/app/actions";
import { useTransition } from "react";

export function AdminControls() {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Сбросить день? Активные талоны будут закрыты.")) {
          start(() => { resetDayAction(); });
        }
      }}
      className="rounded-xl bg-red-600 p-3 font-semibold text-white disabled:opacity-50"
    >
      Сбросить день
    </button>
  );
}
