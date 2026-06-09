import { describe, it, expect } from "vitest";
import { peopleAhead } from "@/lib/queue/position";
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

describe("peopleAhead", () => {
  it("считает только ожидающих, созданных раньше, в том же направлении", () => {
    const mine = t({ id: "me", created_at: "2026-06-08T10:05:00Z" });
    const all = [
      t({ id: "a", created_at: "2026-06-08T10:01:00Z" }),
      t({ id: "b", created_at: "2026-06-08T10:02:00Z" }),
      t({ id: "c", created_at: "2026-06-08T10:06:00Z" }),
      t({ id: "d", status: "done", created_at: "2026-06-08T10:00:00Z" }),
      mine,
    ];
    expect(peopleAhead(all, "me")).toBe(2);
  });

  it("возвращает 0, если талона нет среди ожидающих", () => {
    expect(peopleAhead([], "missing")).toBe(0);
  });
});
