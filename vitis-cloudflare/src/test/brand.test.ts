import { describe, expect, it } from "vitest";
import { contrast, derive, AA } from "@/lib/brand";

describe("brand contrast (WCAG AA)", () => {
  it("computes the WCAG ratio for black on white as 21", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("picks text over the default VITIS primary that reaches AA", () => {
    const d = derive("#593069", "#ab668f");
    expect(d.checks[0]!.ratio).toBeGreaterThanOrEqual(AA);
    expect(d.checks[1]!.ratio).toBeGreaterThanOrEqual(AA);
    expect(d.checks[2]!.ratio).toBeGreaterThanOrEqual(AA);
  });
  it("flags a light primary used as text on white as below AA", () => {
    const d = derive("#ffe066", "#b597cc");
    expect(d.checks[3]!.ratio).toBeLessThan(AA);
  });
  it("falls back to the default colours for invalid hex", () => {
    expect(derive("azul", null).primary).toBe("#593069");
  });
});
