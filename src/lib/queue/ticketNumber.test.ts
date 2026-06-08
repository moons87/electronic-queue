import { describe, it, expect } from "vitest";
import { formatTicketNumber } from "@/lib/queue/ticketNumber";

describe("formatTicketNumber", () => {
  it("дополняет номер нулями до трёх знаков", () => {
    expect(formatTicketNumber("A", 1)).toBe("A-001");
    expect(formatTicketNumber("B", 27)).toBe("B-027");
  });
  it("не обрезает номера больше 999", () => {
    expect(formatTicketNumber("A", 1000)).toBe("A-1000");
  });
});
