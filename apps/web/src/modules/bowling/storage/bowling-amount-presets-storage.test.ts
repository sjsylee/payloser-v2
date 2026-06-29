import { describe, expect, it } from "vitest";
import {
  readSavedBowlingAmountPresets,
  writeSavedBowlingAmountPresets,
} from "./bowling-amount-presets-storage";

function createMemoryStorage(initialValue: string | null = null) {
  let value = initialValue;
  let removed = false;

  return {
    get removed() {
      return removed;
    },
    get value() {
      return value;
    },
    getItem: () => value,
    removeItem: () => {
      removed = true;
      value = null;
    },
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
  };
}

describe("bowling amount presets storage", () => {
  it("reads only valid saved amount presets", () => {
    const storage = createMemoryStorage(
      JSON.stringify(["20000", "nope", "0", "18000"]),
    );

    expect(readSavedBowlingAmountPresets(storage)).toEqual(["20000", "18000"]);
  });

  it("removes corrupted preset data", () => {
    const storage = createMemoryStorage("{broken");

    expect(readSavedBowlingAmountPresets(storage)).toEqual([]);
    expect(storage.removed).toBe(true);
  });

  it("writes saved amount presets", () => {
    const storage = createMemoryStorage();

    writeSavedBowlingAmountPresets(["20000", "18000"], storage);
    expect(storage.value).toBe(JSON.stringify(["20000", "18000"]));
  });
});
