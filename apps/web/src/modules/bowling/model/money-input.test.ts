import { describe, expect, it } from "vitest";
import { formatAmountInput, normalizeAmountInput } from "./money-input";

describe("money input", () => {
  it("formats typed amount values with Korean number grouping", () => {
    expect(formatAmountInput("")).toBe("");
    expect(formatAmountInput("20000")).toBe("20,000");
    expect(formatAmountInput("20,000")).toBe("20,000");
  });

  it("normalizes typed amount values to digits only", () => {
    expect(normalizeAmountInput("20,000원")).toBe("20000");
    expect(normalizeAmountInput("abc12")).toBe("12");
  });
});
