import { describe, expect, it } from "vitest";
import {
  filterSavedBowlingHandicaps,
  readSavedBowlingHandicaps,
  writeSavedBowlingHandicap,
} from "./bowling-handicap-storage";

function createMemoryStorage(initialValue = "{}") {
  let value: string | null = initialValue;
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

describe("bowling handicap storage", () => {
  it("filters saved handicaps to current members and positive values", () => {
    expect(
      filterSavedBowlingHandicaps({
        memberIds: ["m1", "m2"],
        savedHandicaps: {
          m1: "30",
          m2: "0",
          m3: "50",
        },
      }),
    ).toEqual({ m1: "30" });
  });

  it("reads saved handicaps from storage", () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        m1: "30",
        m2: "10",
        missing: "40",
      }),
    );

    expect(readSavedBowlingHandicaps(["m1"], storage)).toEqual({ m1: "30" });
  });

  it("removes corrupted saved handicap data", () => {
    const storage = createMemoryStorage("{not-json");

    expect(readSavedBowlingHandicaps(["m1"], storage)).toEqual({});
    expect(storage.removed).toBe(true);
  });

  it("writes and removes saved handicap values", () => {
    const storage = createMemoryStorage(JSON.stringify({ m1: "30" }));

    writeSavedBowlingHandicap("m2", "20", storage);
    expect(JSON.parse(storage.value ?? "{}")).toEqual({ m1: "30", m2: "20" });

    writeSavedBowlingHandicap("m1", "0", storage);
    expect(JSON.parse(storage.value ?? "{}")).toEqual({ m2: "20" });
  });
});
