import { describe, it, expect } from "vitest";
import { estimateWaitMinutes } from "@/lib/queue/waitTime";

describe("estimateWaitMinutes", () => {
  it("умножает количество людей на среднее время обслуживания", () => {
    expect(estimateWaitMinutes(3, 5)).toBe(15);
  });
  it("ноль людей — ноль ожидания", () => {
    expect(estimateWaitMinutes(0, 5)).toBe(0);
  });
  it("использует запасное значение, если среднее неизвестно", () => {
    expect(estimateWaitMinutes(2, null)).toBe(10);
  });
});
