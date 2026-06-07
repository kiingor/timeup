import { describe, expect, it } from "vitest";
import { amountRemainingBrl, clampPct, pctOfTier, pctRemaining, reachedTier } from "./metas";
import { parseBRLInput, roundMoney } from "./money";

describe("pctOfTier", () => {
  it("computes ratio", () => {
    expect(pctOfTier(60000, 80000)).toBeCloseTo(0.75);
  });
  it("guards zero / negative target", () => {
    expect(pctOfTier(100, 0)).toBe(0);
    expect(pctOfTier(100, -5)).toBe(0);
  });
  it("can exceed 1 when over-achieving", () => {
    expect(pctOfTier(120000, 100000)).toBeCloseTo(1.2);
  });
  it("treats negative realized as 0", () => {
    expect(pctOfTier(-10, 100)).toBe(0);
  });
});

describe("pctRemaining", () => {
  it("clamps at 0 once reached", () => {
    expect(pctRemaining(120000, 100000)).toBe(0);
  });
  it("complements pctOfTier", () => {
    expect(pctRemaining(60000, 80000)).toBeCloseTo(0.25);
  });
});

describe("amountRemainingBrl", () => {
  it("never goes negative", () => {
    expect(amountRemainingBrl(120000, 100000)).toBe(0);
    expect(amountRemainingBrl(60000, 80000)).toBe(20000);
  });
});

describe("reachedTier", () => {
  it("true at/over target", () => {
    expect(reachedTier(80000, 80000)).toBe(true);
    expect(reachedTier(79999.99, 80000)).toBe(false);
  });
});

describe("clampPct", () => {
  it("clamps to [0,1]", () => {
    expect(clampPct(1.2)).toBe(1);
    expect(clampPct(-1)).toBe(0);
    expect(clampPct(0.5)).toBe(0.5);
    expect(clampPct(NaN)).toBe(0);
  });
});

describe("money", () => {
  it("rounds to cents", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.675)).toBe(2.68);
  });
  it("parses pt-BR currency", () => {
    expect(parseBRLInput("R$ 1.234,56")).toBe(1234.56);
    expect(parseBRLInput("60000")).toBe(60000);
    expect(parseBRLInput("80.000,00")).toBe(80000);
    expect(parseBRLInput("abc")).toBeNull();
  });
});
