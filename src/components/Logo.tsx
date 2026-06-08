"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";

// Логотип колледжа. Пытается показать картинку из brand.logoSrc; если файла
// нет — рисует винную монограмму из первой буквы короткого названия.
// chip=true кладёт логотип на светлую подложку — для тёмных поверхностей (табло).
export function Logo({ size = 40, chip = false }: { size?: number; chip?: boolean }) {
  const [broken, setBroken] = useState(false);
  const letter = brand.shortName.trim().charAt(0).toUpperCase() || "К";

  if (broken) {
    return (
      <span
        className="font-display grid place-items-center rounded-full bg-wine-700 font-bold text-paper ring-1 ring-brass-500/40"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden
      >
        {letter}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logoSrc}
      alt={brand.fullName}
      width={size}
      height={size}
      onError={() => setBroken(true)}
      className={`object-contain ${chip ? "rounded-xl bg-paper p-1.5 shadow-sm" : "rounded-full"}`}
      style={{ width: size, height: size }}
    />
  );
}
