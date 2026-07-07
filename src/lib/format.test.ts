import { describe, expect, it } from "vitest";
import { formatDate, formatIDR, formatNumber, formatTons } from "./format";

describe("format helpers", () => {
  it("formatIDR uses IDR currency", () => {
    expect(formatIDR(1_500_000)).toContain("1");
    expect(formatIDR(1_500_000)).toMatch(/Rp|IDR/);
  });

  it("formatNumber uses Indonesian grouping", () => {
    expect(formatNumber(2500)).toBe("2.500");
  });

  it("formatDate returns dash for invalid input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formatDate formats valid ISO string", () => {
    const out = formatDate("2026-06-07T10:00:00.000Z");
    expect(out).not.toBe("—");
    expect(out.length).toBeGreaterThan(5);
  });

  it("formatTons appends ton unit", () => {
    expect(formatTons(12)).toContain("ton");
  });
});
