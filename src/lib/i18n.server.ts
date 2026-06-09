import { cookies } from "next/headers";
import type { Lang } from "./i18n";

// Чтение языка из cookie на сервере (для серверных компонентов).
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "kz" ? "kz" : "ru";
}
