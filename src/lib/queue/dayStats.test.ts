import { describe, it, expect } from "vitest";
import { summarizeDay } from "@/lib/queue/dayStats";
import type { Ticket } from "@/lib/queue/types";

function t(p: Partial<Ticket>): Ticket {
  return {
    id: "x", service_id: "s", seq: 1, number: "A-001", status: "waiting",
    counter_id: null, recall_count: 0, service_day: "2026-06-08",
    created_at: "2026-06-08T10:00:00Z", called_at: null, served_at: null,
    finished_at: null, device_id: null,
    ...p,
  };
}

describe("summarizeDay", () => {
  it("считает статусы и итоги", () => {
    const s = summarizeDay([
      t({ status: "waiting" }),
      t({ status: "waiting" }),
      t({ status: "called" }),
      t({ status: "serving" }),
      t({ status: "done" }),
      t({ status: "no_show" }),
    ]);
    expect(s.total).toBe(6);
    expect(s.waitingNow).toBe(2);
    expect(s.servingNow).toBe(2); // called + serving
    expect(s.served).toBe(1);
    expect(s.noShow).toBe(1);
  });

  it("считает среднее ожидание и приём в минутах", () => {
    const s = summarizeDay([
      t({
        created_at: "2026-06-08T10:00:00Z",
        called_at: "2026-06-08T10:10:00Z", // ждал 10 мин
        served_at: "2026-06-08T10:10:00Z",
        finished_at: "2026-06-08T10:15:00Z", // приём 5 мин
        status: "done",
      }),
    ]);
    expect(s.avgWaitMin).toBe(10);
    expect(s.avgServiceMin).toBe(5);
  });

  it("группирует загрузку по направлениям", () => {
    const s = summarizeDay([
      t({ service_id: "a", status: "waiting" }),
      t({ service_id: "a", status: "waiting" }),
      t({ service_id: "b", status: "serving" }),
    ]);
    const a = s.perService.find((x) => x.serviceId === "a");
    const b = s.perService.find((x) => x.serviceId === "b");
    expect(a?.waiting).toBe(2);
    expect(b?.serving).toBe(1);
  });

  it("на пустом дне возвращает нули и null час пик", () => {
    const s = summarizeDay([]);
    expect(s.total).toBe(0);
    expect(s.avgWaitMin).toBe(0);
    expect(s.busiestHour).toBeNull();
    expect(s.perService).toEqual([]);
  });
});
