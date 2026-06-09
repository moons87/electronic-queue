import type { Ticket } from "./types";

export interface ServiceLoad {
  serviceId: string;
  waiting: number;
  serving: number;
}

export interface DayStats {
  total: number; // всего талонов выдано сегодня
  served: number;
  noShow: number;
  waitingNow: number; // ждут прямо сейчас
  servingNow: number; // вызваны / на приёме
  avgWaitMin: number;
  avgServiceMin: number;
  busiestHour: string | null; // час пик по выдаче талонов (время Алматы)
  perService: ServiceLoad[];
}

const TZ = "Asia/Almaty";

const hourOf = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));

const avg = (xs: number[]) =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;

// Чистый подсчёт статистики за день из списка талонов.
export function summarizeDay(tickets: Ticket[]): DayStats {
  const served = tickets.filter((t) => t.status === "done").length;
  const noShow = tickets.filter((t) => t.status === "no_show").length;
  const waitingNow = tickets.filter((t) => t.status === "waiting").length;
  const servingNow = tickets.filter(
    (t) => t.status === "called" || t.status === "serving",
  ).length;

  const waitMin = tickets
    .filter((t) => t.called_at)
    .map((t) => (Date.parse(t.called_at!) - Date.parse(t.created_at)) / 60000);
  const serviceMin = tickets
    .filter((t) => t.finished_at && (t.served_at || t.called_at))
    .map(
      (t) =>
        (Date.parse(t.finished_at!) - Date.parse((t.served_at || t.called_at)!)) /
        60000,
    );

  // Час пик по выдаче талонов.
  const byHour = new Map<string, number>();
  for (const t of tickets) {
    const h = hourOf(t.created_at);
    byHour.set(h, (byHour.get(h) ?? 0) + 1);
  }
  let busiestHour: string | null = null;
  let max = 0;
  for (const [h, n] of byHour) {
    if (n > max) {
      max = n;
      busiestHour = `${h}:00`;
    }
  }

  // Загрузка по направлениям.
  const svc = new Map<string, ServiceLoad>();
  for (const t of tickets) {
    const e = svc.get(t.service_id) ?? {
      serviceId: t.service_id,
      waiting: 0,
      serving: 0,
    };
    if (t.status === "waiting") e.waiting++;
    if (t.status === "called" || t.status === "serving") e.serving++;
    svc.set(t.service_id, e);
  }

  return {
    total: tickets.length,
    served,
    noShow,
    waitingNow,
    servingNow,
    avgWaitMin: avg(waitMin),
    avgServiceMin: avg(serviceMin),
    busiestHour,
    perService: [...svc.values()],
  };
}
