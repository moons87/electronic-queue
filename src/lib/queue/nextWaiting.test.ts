import { describe, it, expect } from "vitest";
import { selectNextWaiting } from "@/lib/queue/nextWaiting";
import type { Ticket } from "@/lib/queue/types";

function t(p: Partial<Ticket>): Ticket {
  return {
    id: "x", service_id: "s", seq: 1, number: "A-001", status: "waiting",
    counter_id: null, recall_count: 0, service_day: "2026-06-08",
    created_at: "2026-06-08T10:00:00Z", called_at: null, served_at: null, finished_at: null,
    device_id: null,
    ...p,
  };
}

describe("selectNextWaiting", () => {
  it("возвращает самый ранний waiting нужного направления", () => {
    const all = [
      t({ id: "later", created_at: "2026-06-08T10:02:00Z" }),
      t({ id: "earliest", created_at: "2026-06-08T10:01:00Z" }),
      t({ id: "other", service_id: "z", created_at: "2026-06-08T10:00:00Z" }),
    ];
    expect(selectNextWaiting(all, "s")?.id).toBe("earliest");
  });

  it("возвращает null, если ожидающих нет", () => {
    expect(selectNextWaiting([], "s")).toBeNull();
  });
});
